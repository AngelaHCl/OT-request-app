const users = [
    { paynumber: "12345", password: "pass123", role: "employee" },
    { paynumber: "67890", password: "secure456", role: "manager" },
    { paynumber: "11223", password: "mypassword", role: "employee" }
];

let requests = JSON.parse(localStorage.getItem("overtimeRequests")) || [];
let currentUser = null;

document.getElementById("loginForm").addEventListener("submit", function(event) {
    event.preventDefault();
    const paynumber = document.getElementById("paynumber").value;
    const password = document.getElementById("password").value;

    const user = users.find(u => u.paynumber === paynumber && u.password === password);

    if (user) {
        currentUser = user;
        document.getElementById("loginSection").style.display = "none";
        document.getElementById("overtimeForm").style.display = "block";
        alert(`Welcome, Pay Number ${currentUser.paynumber}`);
        if (currentUser.role === "planning") {
            document.getElementById("planningSection").style.display = "block";
            document.getElementById("planningDashboard").style.display = "block";
            renderDashboard();
        }
    } else {
        alert("Invalid Pay Number or Password.");
    }
});

document.getElementById("overtimeType").addEventListener("change", function() {
    const selected = this.value;
    const shiftTimeGroup = document.getElementById("shiftTimeGroup");
    const rdoNote = document.getElementById("rdoNote");
    const rdoStartTimeGroup = document.getElementById("rdoStartTimeGroup");

    if (selected === "RDO") {
        shiftTimeGroup.style.display = "none";
        rdoNote.style.display = "block";
        rdoStartTimeGroup.style.display = "block";
    } else {
        shiftTimeGroup.style.display = "block";
        rdoNote.style.display = "none";
        rdoStartTimeGroup.style.display = "none";
    }
});

document.getElementById("overtimeForm").addEventListener("submit", function(event) {
    event.preventDefault();

    const name = document.getElementById("name").value;
    const startDate = document.getElementById("startDate").value;
    const endDate = document.getElementById("endDate").value;
    const start = document.getElementById("start").value;
    const end = document.getElementById("end").value;
    const type = document.getElementById("type").value;
    const shiftType = document.getElementById("shiftType").value;
    const shiftTime = document.getElementById("shiftTime") ? document.getElementById("shiftTime").value : "";
    const rdoStartTimeEl = document.getElementById("rdoStartTime");
    const rdoStartTime = rdoStartTimeEl ? rdoStartTimeEl.value : null;
    const overtimeType = document.getElementById("overtimeType").value;
    const submittedAt = new Date().toLocaleString();

    const request = {
        name,
        paynumber: currentUser ? currentUser.paynumber : "",
        startDate,
        endDate,
        start,
        end,
        type,
        shiftType,
        shiftTime,
        overtimeType,
        rdoStartTime: overtimeType === "RDO" ? rdoStartTime : null,
        status: "Pending",
        submittedAt
    };

    requests.push(request);
    localStorage.setItem("overtimeRequests", JSON.stringify(requests));

    const output = `
        <h3>Request Submitted</h3>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Start Date:</strong> ${startDate}</p>
        <p><strong>End Date:</strong> ${endDate}</p>
        <p><strong>Start:</strong> ${start}</p>
        <p><strong>End:</strong> ${end}</p>
        <p><strong>Type:</strong> ${type}</p>
        <p><strong>Total Requests:</strong> ${requests.length}</p>
    `;

    document.getElementById("output").innerHTML = output;
    document.getElementById("overtimeForm").reset();

    // If planning dashboard visible, refresh it
    if (document.getElementById("planningDashboard")?.style.display === "block") {
        renderDashboard();
    }
});

function approveLatest() {
    if (requests.length > 0) {
        requests[requests.length - 1].status = "Approved";
        localStorage.setItem("overtimeRequests", JSON.stringify(requests));
        alert("Latest request approved.");
        renderDashboard();
    }
}
function rejectLatest() {
    if (requests.length > 0) {
        requests[requests.length - 1].status = "Rejected";
        localStorage.setItem("overtimeRequests", JSON.stringify(requests));
        alert("Latest request rejected.");
        renderDashboard();
    }
}

function approveRequest(index) {
    if (requests[index]) {
        requests[index].status = "Approved";
        localStorage.setItem("overtimeRequests", JSON.stringify(requests));
        renderDashboard();
    }
}
function rejectRequest(index) {
    if (requests[index]) {
        requests[index].status = "Rejected";
        localStorage.setItem("overtimeRequests", JSON.stringify(requests));
        renderDashboard();
    }
}

function confirmAction(action, index) {
    const message = action === 'approve' ? 'Are you sure you want to approve this request?' : 'Are you sure you want to reject this request?';
    if (!confirm(message)) return;

    if (requests[index]) {
        if (action === 'approve') {
            requests[index].status = "Approved";
        } else {
            requests[index].status = "Rejected";
        }
        localStorage.setItem("overtimeRequests", JSON.stringify(requests));
        renderDashboard();
    }
}

function renderDashboard(page = 1) {
    const currentPage = page;
    const rowsPerPage = 10;

    const searchTerm = (document.getElementById("searchInput")?.value || "").toLowerCase();
    const statusFilter = document.getElementById("statusFilter")?.value || "";
    const shiftFilter = document.getElementById("shiftFilter")?.value || "";
    const dateFilter = document.getElementById("dateFilter")?.value || "";
    const otTypeFilter = document.getElementById("otTypeFilter")?.value || "All";

    const filtered = requests.filter(r => {
        const matchStatus = !statusFilter || r.status === statusFilter;
        const matchShift = !shiftFilter || r.shiftType === shiftFilter;
        const matchDate = !dateFilter || new Date(r.startDate) >= new Date(dateFilter);
        const matchOTType = otTypeFilter === "All" || r.overtimeType === otTypeFilter;
        const matchSearch = !searchTerm || (r.name && r.name.toLowerCase().includes(searchTerm)) || (r.paynumber && r.paynumber.includes(searchTerm));
        return matchStatus && matchShift && matchDate && matchOTType && matchSearch;
    });

    const total = requests.length;
    const pending = requests.filter(r => r.status === "Pending").length;
    const approved = requests.filter(r => r.status === "Approved").length;
    const rejected = requests.filter(r => r.status === "Rejected").length;

    if (document.getElementById("totalCount")) document.getElementById("totalCount").textContent = `Total Requests: ${total}`;
    if (document.getElementById("pendingCount")) document.getElementById("pendingCount").textContent = `Pending: ${pending}`;
    if (document.getElementById("approvedCount")) document.getElementById("approvedCount").textContent = `Approved: ${approved}`;
    if (document.getElementById("rejectedCount")) document.getElementById("rejectedCount").textContent = `Rejected: ${rejected}`;

    const tbody = document.querySelector("#requestsTable tbody");
    if (!tbody) return;
    tbody.innerHTML = "";

    const startIndex = (currentPage - 1) * rowsPerPage;
    const pageItems = filtered.slice(startIndex, startIndex + rowsPerPage);

    pageItems.forEach((request, index) => {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${request.name || ''}</td>
            <td>${request.startDate || ''}</td>
            <td>${request.endDate || ''}</td>
            <td>${request.start || ''}</td>
            <td>${request.end || ''}</td>
            <td>${request.type || ''}</td>
            <td>${request.shiftType || ''}</td>
            <td>${request.shiftTime || ''}</td>
            <td>${request.overtimeType || ''}</td>
            <td>${request.rdoStartTime || ''}</td>
            <td>${request.status || ''}</td>
            <td>
                <button onclick="confirmAction('approve', ${startIndex + index})">Approve</button>
                <button onclick="confirmAction('reject', ${startIndex + index})">Reject</button>
            </td>
        `;
        tbody.appendChild(row);
    });

    renderPagination(filtered.length, currentPage, rowsPerPage);
}

function renderPagination(totalItems, currentPage, itemsPerPage) {
    const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
    const container = document.getElementById("pagination");
    if (!container) return;
    container.innerHTML = "";

    for (let i = 1; i <= totalPages; i++) {
        const btn = document.createElement("button");
        btn.textContent = i;
        btn.disabled = i === currentPage;
        btn.onclick = () => {
            renderDashboard(i);
        };
        container.appendChild(btn);
    }
}

function exportApproved() {
    const approvedRequests = requests.filter(r => r.status === "Approved");
    let csv = "Pay Number,Name,Start Date,End Date,Start,End,Type,Shift Type,Shift Time,Overtime Type,RDO Start Time,Status,Submitted At\n";

    approvedRequests.forEach(request => {
        csv += `${request.paynumber || ''},${request.name || ''},${request.startDate || ''},${request.endDate || ''},${request.start || ''},${request.end || ''},${request.type || ''},${request.shiftType || ''},${request.shiftTime || ''},${request.overtimeType || ''},${request.rdoStartTime || ''},${request.status || ''},${request.submittedAt || ''}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'approved_overtime_requests.csv';
    a.click();
    URL.revokeObjectURL(url);
}

function exportToCSV() {
    let csv = "Pay Number,Name,Start Date,End Date,Start,End,Type,Shift Type,Shift Time,Overtime Type,RDO Start Time,Status,Submitted At\n";
    requests.forEach(request => {
        csv += `${request.paynumber || ''},${request.name || ''},${request.startDate || ''},${request.endDate || ''},${request.start || ''},${request.end || ''},${request.type || ''},${request.shiftType || ''},${request.shiftTime || ''},${request.overtimeType || ''},${request.rdoStartTime || ''},${request.status || ''},${request.submittedAt || ''}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'overtime_requests.csv';
    a.click();
    URL.revokeObjectURL(url);
}
