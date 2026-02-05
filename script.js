// script.js
const applicants = [
  { name: "Amit Patel", mobile: "9988776655", category: "General" },
  { name: "Priya Sharma", mobile: "9876543210", category: "SC" },
  { name: "Rajesh Kumar", mobile: "9123456789", category: "OBC" },
  { name: "Sneha Reddy", mobile: "9012345678", category: "General" },
  { name: "Vikram Singh", mobile: "8899776655", category: "ST" },
  { name: "Anjali Desai", mobile: "9988775544", category: "EWS" },
  { name: "Karan Mehra", mobile: "7766554433", category: "General" },
  { name: "Meera Joshi", mobile: "6655443322", category: "OBC" }
];

const flats = [
  "A-101", "A-102", "A-103", "A-104",
  "B-101", "B-102", "B-103", "B-104"
];

function shuffle(array) {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

function startLottery() {
  const shuffled = shuffle(applicants);
  const results = [];
  const num = Math.min(shuffled.length, flats.length);
  for (let i = 0; i < num; i++) {
    results.push({
      flat: flats[i],
      winner: shuffled[i]
    });
  }
  localStorage.setItem("lotteryResults", JSON.stringify(results));
  const adminContainer = document.getElementById("adminResult");
  if (adminContainer) {
    displayResults("adminResult");
  }
}

function displayResults(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const storedResults = localStorage.getItem("lotteryResults");
  if (!storedResults) {
    container.innerHTML = '<p class="no-result">Lottery draw has not been conducted yet.</p>';
    return;
  }

  const results = JSON.parse(storedResults);
  let html = `
    <table class="result-table">
      <thead>
        <tr>
          <th>Flat Number</th>
          <th>Winner Name</th>
          <th>Mobile Number</th>
          <th>Category</th>
        </tr>
      </thead>
      <tbody>
  `;

  results.forEach((result) => {
    html += `
      <tr>
        <td>${result.flat}</td>
        <td>${result.winner.name}</td>
        <td>${result.winner.mobile}</td>
        <td>${result.winner.category}</td>
      </tr>
    `;
  });

  html += `
      </tbody>
    </table>
  `;

  container.innerHTML = html;
}

window.addEventListener("load", function () {
  const applyForm = document.getElementById("applyForm");
  if (applyForm) {
    applyForm.addEventListener("submit", function (e) {
      e.preventDefault();
      const nameEl = document.getElementById("fullName");
      const mobileEl = document.getElementById("mobile");
      const categoryEl = document.getElementById("category");

      if (nameEl && mobileEl && categoryEl) {
        const name = nameEl.value.trim();
        const mobile = mobileEl.value.trim();
        const category = categoryEl.value;

        if (name && mobile.length === 10 && /^\d{10}$/.test(mobile) && category) {
          alert(`Application submitted successfully for ${name}! (This is a demonstration only.)`);
          applyForm.reset();
        } else {
          alert("Please fill all fields correctly. Mobile number must be exactly 10 digits.");
        }
      }
    });
  }

  if (document.getElementById("adminResult")) {
    displayResults("adminResult");
  }
  if (document.getElementById("publicResult")) {
    displayResults("publicResult");
  }
});
