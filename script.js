document.addEventListener("DOMContentLoaded", () => {
    const toggle = document.querySelector(".menu-toggle");
    const navbar = document.querySelector(".navbar");
    const links = document.querySelectorAll(".navbar a");

    // Menu mobile
    const setMenu = (open) => {
        navbar.classList.toggle("open", open);
        toggle.setAttribute("aria-expanded", String(open));
        toggle.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
    };

    toggle.addEventListener("click", () => {
        setMenu(toggle.getAttribute("aria-expanded") !== "true");
    });

    links.forEach((link) => link.addEventListener("click", () => setMenu(false)));

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") setMenu(false);
    });

    // Link ativo conforme a secção visível
    const sections = document.querySelectorAll("main section[id]");
    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                links.forEach((link) => {
                    link.classList.toggle(
                        "active",
                        link.getAttribute("href") === `#${entry.target.id}`
                    );
                });
            });
        },
        { rootMargin: "-40% 0px -55% 0px" }
    );
    sections.forEach((section) => observer.observe(section));

    // Revelar elementos ao fazer scroll
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!reduceMotion && "IntersectionObserver" in window) {
        const targets = document.querySelectorAll(
            ".section-heading, .about > p, .members > p, .project-card, .join > *, .contact > p, .contact-list"
        );

        // Atraso escalonado dentro de cada secção
        const counters = new Map();
        targets.forEach((el) => {
            const section = el.closest("section");
            const i = counters.get(section) || 0;
            counters.set(section, i + 1);
            el.style.setProperty("--delay", `${Math.min(i, 4) * 0.12}s`);
            el.classList.add("reveal");
        });

        const revealObserver = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) return;
                    const el = entry.target;
                    el.classList.add("visible");
                    revealObserver.unobserve(el);

                    // No fim, devolve o elemento ao estado normal (para o hover dos cartões funcionar)
                    el.addEventListener(
                        "transitionend",
                        () => {
                            el.classList.remove("reveal", "visible");
                            el.style.removeProperty("--delay");
                        },
                        { once: true }
                    );
                });
            },
            { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
        );

        targets.forEach((el) => revealObserver.observe(el));
    }

    // Formulário de contacto
    const form = document.getElementById("form-juntar");

    if (form) {
        const status = form.querySelector(".form-status");
        const button = form.querySelector("button[type='submit']");

        const showStatus = (text, type) => {
            status.textContent = text;
            status.className = `form-status ${type}`;
        };

        form.addEventListener("submit", async (e) => {
            e.preventDefault();

            if (form.elements["access_key"].value.startsWith("SUA-")) {
                showStatus("O formulário ainda não está configurado. É necessário adicionar a chave do Web3Forms.", "error");
                return;
            }

            button.disabled = true;
            button.textContent = "A enviar candidatura...";
            showStatus("", "");

            try {
                // Junta valores repetidos (ex.: várias áreas de interesse) numa só linha
                const data = {};
                new FormData(form).forEach((value, key) => {
                    data[key] = key in data ? `${data[key]}, ${value}` : value;
                });
                const res = await fetch(form.action, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", Accept: "application/json" },
                    body: JSON.stringify(data),
                });
                const json = await res.json();

                if (!res.ok || !json.success) throw new Error(json.message || "Erro");

                showStatus("Candidatura enviada com sucesso. Entraremos em contacto assim que possível.", "success");
                form.reset();
            } catch {
                showStatus("Não foi possível enviar a candidatura. Tente novamente ou contacte-nos através dos dados indicados no site.", "error");
            } finally {
                button.disabled = false;
                button.textContent = "Enviar candidatura";
            }
        });
    }

    // Janela da mentoria
    const modal = document.getElementById("modal-mentoria");

    if (modal) {
        let lastFocus = null;
        const closeBtn = modal.querySelector(".modal-close");

        const openModal = () => {
            lastFocus = document.activeElement;
            modal.hidden = false;
            document.body.classList.add("modal-lock");
            requestAnimationFrame(() => modal.classList.add("is-open"));
            closeBtn.focus();
        };

        const closeModal = (restoreFocus = true) => {
            modal.classList.remove("is-open");
            document.body.classList.remove("modal-lock");
            setTimeout(() => { modal.hidden = true; }, 250);
            if (restoreFocus && lastFocus && lastFocus.focus) {
                lastFocus.focus({ preventScroll: true });
            }
        };

        document.querySelectorAll("[data-open-mentoria]").forEach((el) => {
            el.addEventListener("click", openModal);
            if (el.getAttribute("role") === "button") {
                el.addEventListener("keydown", (e) => {
                    if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        openModal();
                    }
                });
            }
        });

        modal.querySelectorAll("[data-close]").forEach((el) => {
            el.addEventListener("click", () => closeModal());
        });

        // Ao seguir um link da janela, fecha-a sem devolver o foco ao ponto anterior
        modal.querySelectorAll(".modal-actions a").forEach((a) => {
            a.addEventListener("click", () => closeModal(false));
        });

        document.addEventListener("keydown", (e) => {
            if (modal.hidden) return;

            if (e.key === "Escape") {
                closeModal();
                return;
            }

            // Mantém o Tab dentro da janela
            if (e.key === "Tab") {
                const items = modal.querySelectorAll("a[href], button:not([disabled])");
                const first = items[0];
                const last = items[items.length - 1];
                if (e.shiftKey && document.activeElement === first) {
                    e.preventDefault();
                    last.focus();
                } else if (!e.shiftKey && document.activeElement === last) {
                    e.preventDefault();
                    first.focus();
                }
            }
        });
    }

    // Ano atual no rodapé
    const ano = document.getElementById("ano");
    if (ano) ano.textContent = new Date().getFullYear();
});