document.addEventListener("DOMContentLoaded", () => {
    // Chart.js - Earnings Line Chart
    const ctxEarnings = document.getElementById("earningsChart")?.getContext("2d");
    if (ctxEarnings) {
        new Chart(ctxEarnings, {
            type: "line",
            data: {
                labels: ["Ene", "Feb", "Mar", "Abr", "May", "Jun"],
                datasets: [{
                    label: "Ganancias",
                    data: [40000, 42000, 45000, 47000, 49000, 52000],
                    borderColor: "#5a2d7b",
                    backgroundColor: "rgba(90, 45, 123, 0.1)",
                    tension: 0.3,
                    fill: true,
                    pointBackgroundColor: "#7c48a1",
                    pointBorderColor: "#fff",
                    pointHoverRadius: 6
                }]
            },
            options: {
                plugins: { legend: { labels: { color: "#5a2d7b", font: { weight: "bold" } } } },
                scales: {
                    x: { ticks: { color: "#5a2d7b" } },
                    y: { ticks: { color: "#5a2d7b" } }
                }
            }
        });
    }

    // Chart.js - Revenue Bar Chart
    const ctxRevenue = document.getElementById("revenueSourcesChart")?.getContext("2d");
    if (ctxRevenue) {
        new Chart(ctxRevenue, {
            type: "bar",
            data: {
                labels: ["Ene", "Feb", "Mar", "Abr", "May", "Jun"],
                datasets: [{
                    label: "Intercambios",
                    data: [30, 40, 35, 50, 60, 55],
                    backgroundColor: "#7c48a1",
                    borderRadius: 10,
                    borderSkipped: false
                }]
            },
            options: {
                plugins: { legend: { labels: { color: "#7c48a1", font: { weight: "bold" } } } },
                scales: {
                    x: { ticks: { color: "#7c48a1" } },
                    y: { ticks: { color: "#7c48a1" } }
                }
            }
        });
    }

    // Section Navigation
    const sections = document.querySelectorAll(".section");
    const navLinks = document.querySelectorAll("#sidebar .nav-link");

    function showSectionFromHash() {
        const hash = window.location.hash || "#dashboard";
        const targetId = hash.substring(1);

        sections.forEach(section => {
            const isActive = section.id === targetId;
            section.style.display = isActive ? "block" : "none";
            section.style.opacity = isActive ? "1" : "0";
        });

        navLinks.forEach(link => {
            link.classList.toggle("active", link.getAttribute("href") === hash);
        });

        setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 50);
    }

    navLinks.forEach(link => {
        link.addEventListener("click", e => {
            e.preventDefault();
            const hash = link.getAttribute("href");
            history.pushState(null, null, hash);
            showSectionFromHash();
        });
    });

    window.addEventListener("hashchange", showSectionFromHash);
    showSectionFromHash();

    // Add Course
    const courseForm = document.getElementById("addCourseForm");
    const courseTable = document.querySelector("#courses-list");

    if (courseForm && courseTable) {
        courseForm.addEventListener("submit", function (e) {
            e.preventDefault();

            const getValue = id => document.getElementById(id)?.value || "";
            const newId = Date.now().toString().slice(-4);

            const estado = getValue("courseState");
            const badgeClass =
                estado === "Publicado" ? "badge bg-success" :
                estado === "Borrador" ? "badge bg-secondary" :
                "badge bg-warning text-dark";

            const newRow = document.createElement("tr");
            newRow.innerHTML = `
                <td>${newId}</td>
                <td>${getValue("courseName")}</td>
                <td>${getValue("courseDescription")}</td>
                <td>${getValue("courseCategory")}</td>
                <td>${getValue("courseDate")}</td>
                <td>${getValue("courseTime")}</td>
                <td>${getValue("courseSessions")}</td>
                <td>${getValue("courseUser")}</td>
                <td><span class="${badgeClass}">${estado}</span></td>
                <td>$${getValue("coursePrice")}</td>
                <td>
                    <button class="btn btn-sm btn-primary"><i class="bi bi-eye"></i></button>
                    <button class="btn btn-sm btn-danger"><i class="bi bi-trash"></i></button>
                    <button class="btn btn-sm btn-warning"><i class="bi bi-pencil"></i></button>
                </td>
            `;

            courseTable.appendChild(newRow);
            bootstrap.Modal.getInstance(document.getElementById("addCourseModal"))?.hide();
            courseForm.reset();
        });
    }

    // Add User
    const userForm = document.getElementById("addUserForm");
    const userTable = document.querySelector("#usuarios table tbody");
    let userIdCounter = userTable?.rows.length + 1 || 1;

    if (userForm && userTable) {
        userForm.addEventListener("submit", function (e) {
            e.preventDefault();

            const getValue = id => document.getElementById(id)?.value || "";
            const subscription = getValue("userSubscription");
            const badgeClass = subscription === "Activa" ? "bg-success" : "bg-secondary";

            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${userIdCounter++}</td>
                <td>${getValue("userName")}</td>
                <td>${getValue("userUsername")}</td>
                <td>${getValue("userEmail")}</td>
                <td>${getValue("userDate")}</td>
                <td>0</td>
                <td>0</td>
                <td><span class="badge ${badgeClass}">${subscription}</span></td>
                <td>
                    <button class="btn btn-sm btn-primary"><i class="bi bi-eye"></i></button>
                    <button class="btn btn-sm btn-warning"><i class="bi bi-pencil"></i></button>
                    <button class="btn btn-sm btn-danger"><i class="bi bi-trash"></i></button>
                </td>
            `;

            userTable.appendChild(row);
            bootstrap.Modal.getInstance(document.getElementById("addUserModal"))?.hide();
            userForm.reset();
        });
    }

    // Logout Modal
    const logoutLink = document.getElementById("logoutLink");
    const confirmLogoutBtn = document.getElementById("confirmLogoutBtn");
    const logoutModalEl = document.getElementById("logoutConfirmModal");
    const logoutModal = logoutModalEl ? new bootstrap.Modal(logoutModalEl) : null;

    if (logoutLink && logoutModal) {
        logoutLink.addEventListener("click", e => {
            e.preventDefault();
            logoutModal.show();
        });
    }

    if (confirmLogoutBtn) {
        confirmLogoutBtn.addEventListener("click", () => {
            window.location.href = "../../index.html";
        });
    }
});
