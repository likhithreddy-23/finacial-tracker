/* ================= DATE HELPERS ================= */
function getTodayLocalDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDate(ts) {
  return new Date(ts).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

/* ================= ANIMATED COUNTER ================= */
function animateValue(element, start, end, duration = 800) {
  let startTime = null;

  function animation(time) {
    if (!startTime) startTime = time;
    const progress = Math.min((time - startTime) / duration, 1);
    const value = Math.round(start + (end - start) * progress);
    element.innerText = `₹${value}`;

    if (progress < 1) requestAnimationFrame(animation);
  }

  requestAnimationFrame(animation);
}
function animateSection(el) {
  if (!el) return;
  el.animate(
    [
      { opacity: 0, transform: "translateY(12px)" },
      { opacity: 1, transform: "translateY(0)" }
    ],
    {
      duration: 520,
      easing: "cubic-bezier(.22,.61,.36,1)",
      fill: "forwards"
    }
  );
}

/* ================= DATA ================= */
let transactions;
try {
  transactions = JSON.parse(localStorage.getItem("transactions")) || [];
  if (!Array.isArray(transactions)) transactions = [];
} catch {
  transactions = [];
}

let pieChart;

/* ================= UPDATE UI ================= */
function updateUI(data = transactions) {
  let income = 0, expense = 0;
  const tableBody = document.getElementById("tableBody");
  tableBody.innerHTML = "";
  animateSection(document.querySelector(".summary"));
  animateSection(document.querySelector("table"));
  // PRO: latest first
  data.sort((a, b) => b.date - a.date);

  data.forEach((t, index) => {
    t.type === "income" ? income += t.amount : expense += t.amount;

    tableBody.innerHTML += `
      <tr>
        <td>${formatDate(t.date)}</td>
        <td>${t.desc}</td>
        <td>₹${t.amount}</td>
        <td>${t.type}</td>
        <td>
          <button class="delete" onclick="deleteTransaction(${index})">X</button>
        </td>
      </tr>`;
  });

  const balance = income - expense;

  animateValue(document.getElementById("income"), 0, income);
  animateValue(document.getElementById("expense"), 0, expense);
  animateValue(document.getElementById("balance"), 0, balance);

  drawChart(income, expense);
  checkBudget(expense);
  updateGoal(balance);
  autoSave();


  // subtle refresh animation
  document.querySelectorAll(".summary p").forEach(el => {
    el.animate(
      [
        { transform: "translateY(6px)", opacity: 0 },
        { transform: "translateY(0)", opacity: 1 }
      ],
      { duration: 500, easing: "ease-out" }
    );
  });
}

/* ================= ADD TRANSACTION ================= */
function addTransaction() {
  const desc = description.value.trim();
  const amountVal = Number(amount.value);
  const dateVal = date.value;

  if (!desc || amountVal <= 0 || !dateVal) {
    alert("Please enter valid details");
    return;
  }

  transactions.push({
    desc,
    amount: amountVal,
    date: new Date(dateVal).getTime(),
    type: type.value
  });

  description.value = "";
  amount.value = "";
  date.value = getTodayLocalDate();

  updateUI();
}

function deleteTransaction(index) {
  transactions.splice(index, 1);
  updateUI();
}

function saveData() {
  autoSave();
  alert("Data Saved");
}

function clearData() {
  if (confirm("Clear all data?")) {
    transactions = [];
    localStorage.removeItem("transactions");
    updateUI();
  }
}

function autoSave() {
  localStorage.setItem("transactions", JSON.stringify(transactions));
}

/* ================= SEARCH & FILTER ================= */
function applyFilters() {
  const search = searchInput.value.toLowerCase();
  const filter = filterType.value;

  const filtered = transactions.filter(t =>
    t.desc.toLowerCase().includes(search) &&
    (filter === "all" || t.type === filter)
  );

  updateUI(filtered);
}

/* ================= EXPORT ================= */
function exportCSV() {
  let csv = "Date,Description,Amount,Type\n";
  transactions.forEach(t => {
    csv += `${formatDate(t.date)},${t.desc},${t.amount},${t.type}\n`;
  });

  const blob = new Blob([csv], { type: "text/csv" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "finance_data.csv";
  link.click();
}

/* ================= PIE CHART ================= */
function drawChart(income, expense) {
  const ctx = document.getElementById("pieChart");
  if (pieChart) pieChart.destroy();

  pieChart = new Chart(ctx, {
    type: "pie",
    data: {
      labels: ["Income", "Expense"],
      datasets: [{
        data: [income, expense],
        backgroundColor: ["#22c55e", "#ef4444"]
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 900,
        easing: "easeOutQuart"
      },
      plugins: {
        legend: {
          labels: {
            color: "#e5e7eb",
            font: { size: 14, weight: "600" }
          }
        }
      }
    }
  });
}

/* ================= SIMPLE INTEREST ================= */
function calculateInterest() {
  const p = Number(principal.value);
  const r = Number(rate.value);
  const t = Number(time.value);

  if (p <= 0 || r <= 0 || t <= 0) {
    interestResult.innerText = "Please enter valid values";
    return;
  }

  const interest = (p * r * t) / 100;
  interestResult.innerText =
    `Interest: ₹${interest.toFixed(2)} | Total: ₹${(p + interest).toFixed(2)}`;
}

/* ================= BUDGET ================= */
let monthlyBudget = Number(localStorage.getItem("monthlyBudget")) || 0;

function setBudget() {
  const value = Number(budgetInput.value);
  if (value <= 0) return;

  monthlyBudget = value;
  localStorage.setItem("monthlyBudget", value);
  budgetInput.value = "";
  updateUI();
}

function checkBudget(totalExpense = 0) {
  if (monthlyBudget > 0 && totalExpense > monthlyBudget) {
    budgetWarning.innerText = "⚠ Budget limit exceeded!";
    budgetWarning.style.color = "red";
  } else {
    budgetWarning.innerText = "";
  }
}

/* ================= SAVINGS GOAL ================= */
let savingsGoal = Number(localStorage.getItem("savingsGoal")) || 0;

function setGoal() {
  const value = Number(goalInput.value);
  if (value <= 0) return;

  savingsGoal = value;
  localStorage.setItem("savingsGoal", value);
  goalInput.value = "";
  updateUI();
}

function updateGoal(balance = 0) {
  if (savingsGoal <= 0) return;

  let percent = (balance / savingsGoal) * 100;
  percent = Math.min(Math.max(percent, 0), 100);

  progressBar.style.width = percent + "%";
  goalStatus.innerText = `Progress: ${percent.toFixed(1)}% of ₹${savingsGoal}`;
}
/* ================= THEME TOGGLE ================= */
const themeToggle = document.getElementById("themeToggle");

function applyTheme(theme) {
  document.body.classList.toggle("light", theme === "light");
  themeToggle.innerText = theme === "light" ? "🌙 Dark" : "☀ Light";
  localStorage.setItem("theme", theme);
}

themeToggle.addEventListener("click", () => {
  const theme = document.body.classList.contains("light") ? "dark" : "light";
  applyTheme(theme);
});

/* ================= INIT ================= */
window.addEventListener("load", () => {
  setTimeout(() => {
    const intro = document.getElementById("intro");
    intro.classList.add("fade-out");

    setTimeout(() => {
      intro.style.display = "none";
    }, 900);
  }, 1800);

  applyTheme(localStorage.getItem("theme") || "dark");
  updateUI();
});

