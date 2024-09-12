const columns = document.querySelectorAll(".column");
const modal = document.getElementById("modal");
const detailsModal = document.getElementById("details-modal");
const cancelBtn = document.getElementById("cancel-btn");
const detailsCancelBtn = document.getElementById("details-cancel-btn");
const detailsModalContent = document.getElementById("details-modal-content");
let currentColumnId = null;
let lastMovedTime = {};
let cardHistory = {};
let lastColumnId = {}; // Para rastrear a última coluna do card
const columnsNames = {
    "to-do-column": "A Fazer",
    "in-progress-column": "Em Progresso",
    "done-column": "Concluído",
    "created": "Criado"
};

// Função para atualizar o histórico de movimentação
function updateHistory(card, newColumnId) {
    const cardId = card.dataset.id;
    const now = new Date();
    const lastTime = lastMovedTime[cardId] || new Date(0);
    const diffSeconds = (now - lastTime) / 1000; // Tempo em segundos

    if (diffSeconds >= 1) {
        lastMovedTime[cardId] = now;
        if (!cardHistory[cardId]) {
            cardHistory[cardId] = [];
        }
        cardHistory[cardId].push({
            type: 'Movido',
            message: `${columnsNames[lastColumnId[cardId]] || 'Criado'} -> ${columnsNames[newColumnId]}`,
            timestamp: now.toLocaleTimeString()
        });
        lastColumnId[cardId] = newColumnId; // Atualiza a última coluna
        saveData(); // Salva dados ao atualizar o histórico
    }
}

function saveData() {
    const boardData = {};
    columns.forEach((column) => {
        const columnId = column.id;
        boardData[columnId] = [];
        column.querySelectorAll(".item").forEach((card) => {
            const headerElement = card.querySelector(".header");
            const bodyElement = card.querySelector(".body");
            
            if (headerElement && bodyElement) {
                boardData[columnId].push({
                    id: card.dataset.id,
                    text: headerElement.innerText,
                    description: bodyElement.innerText
                });
            }
        });
    });
    localStorage.setItem("kanbanData", JSON.stringify(boardData));
    localStorage.setItem("cardHistory", JSON.stringify(cardHistory));
    localStorage.setItem("lastColumnId", JSON.stringify(lastColumnId));
    localStorage.setItem("lastMovedTime", JSON.stringify(lastMovedTime));
}


function loadData() {
    const boardData = JSON.parse(localStorage.getItem("kanbanData"));
    const storedHistory = JSON.parse(localStorage.getItem("cardHistory"));
    const storedLastColumnId = JSON.parse(localStorage.getItem("lastColumnId"));
    const storedLastMovedTime = JSON.parse(localStorage.getItem("lastMovedTime"));

    if (boardData) {
        Object.keys(boardData).forEach((columnId) => {
            const column = document.getElementById(columnId);
            boardData[columnId].forEach((cardData) => {
                const newCard = document.createElement("div");
                newCard.classList.add("item");
                newCard.draggable = true;
                newCard.dataset.id = cardData.id;

                newCard.innerHTML = `
                    <div class="header">${cardData.text}</div>
                    <div class="sep"></div>
                    <div class="body">${cardData.description}</div>
                    <div class="buttons">
                        <button class="details-btn">Historico</button>
                        <button class="delete-btn">Excluir</button> <!-- Botão de excluir -->
                    </div>
                `;

                newCard.addEventListener("dragstart", (e) => {
                    e.target.classList.add("dragging");
                });

                newCard.addEventListener("dragend", (e) => {
                    e.target.classList.remove("dragging");
                    const newColumnId = e.target.closest(".column").id;
                    updateHistory(newCard, newColumnId);
                    saveData(); // Salva dados ao mover o card
                });

                column.insertBefore(newCard, column.querySelector(".add-card-btn"));
            });
        });
    }

    cardHistory = storedHistory || {};
    lastColumnId = storedLastColumnId || {};
    lastMovedTime = storedLastMovedTime || {};
}

// Chama loadData ao carregar a página
window.addEventListener("load", loadData);

document.addEventListener("dragstart", (e) => {
    e.target.classList.add("dragging");
});

document.addEventListener("dragend", (e) => {
    e.target.classList.remove("dragging");
    const draggingCard = e.target.closest(".item");
    if (draggingCard) {
        const newColumnId = draggingCard.closest(".column").id;
        updateHistory(draggingCard, newColumnId);
        saveData(); // Salva dados ao mover o card
    }
});

columns.forEach((item) => {
    item.addEventListener("dragover", (e) => {
        e.preventDefault(); // Permite o comportamento de 'drop'
        const dragging = document.querySelector(".dragging");
        const applyAfter = getNewPosition(item, e.clientY);

        if (applyAfter && !applyAfter.classList.contains("head")) {
            applyAfter.insertAdjacentElement("afterend", dragging);
        } else {
            const firstCard = item.querySelector(".item");
            item.insertBefore(dragging, firstCard);
        }
    });
});

function getNewPosition(column, posY) {
    const cards = column.querySelectorAll(".item:not(.dragging)");
    let result;

    for (let refer_card of cards) {
        const box = refer_card.getBoundingClientRect();
        const boxCenterY = box.y + box.height / 2;

        if (posY >= boxCenterY) result = refer_card;
    }

    return result;
}

document.querySelectorAll(".add-card-btn").forEach((button) => {
    button.addEventListener("click", (e) => {
        currentColumnId = e.target.getAttribute("data-column-id");
        modal.style.display = "flex"; // Exibe o modal
    });
});

cancelBtn.addEventListener("click", () => {
    modal.style.display = "none"; // Esconde o modal
});

document.getElementById("new-card-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const newCardText = document.getElementById("new-card-text").value;
    const newCardDescription = document.getElementById("new-card-description").value;
    if (newCardText.trim() === "" || newCardDescription.trim() === "") return;

    const newCard = document.createElement("div");
    newCard.classList.add("item");
    newCard.draggable = true;
    newCard.dataset.id = Date.now(); // Adiciona um ID único para rastreamento

    newCard.innerHTML = `
        <div class="header">${newCardText}</div>
        <div class="sep"></div>
        <div class="body">${newCardDescription}</div>
        <div class="buttons">
        <button class="details-btn">Historico</button>
        <button class="delete-btn">Excluir</button> <!-- Botão de excluir -->
        </div>

    `;

    newCard.addEventListener("dragstart", (e) => {
        e.target.classList.add("dragging");
    });

    newCard.addEventListener("dragend", (e) => {
        e.target.classList.remove("dragging");
        const newColumnId = e.target.closest(".column").id;
        updateHistory(newCard, newColumnId);
        saveData(); // Salva dados ao adicionar o card
    });

    const column = document.getElementById(currentColumnId);
    column.insertBefore(newCard, column.querySelector(".add-card-btn"));

    updateHistory(newCard, currentColumnId);
    modal.style.display = "none";
    document.getElementById("new-card-text").value = "";
    document.getElementById("new-card-description").value = "";
    saveData(); // Salva dados ao adicionar o card
});

document.addEventListener("click", (e) => {
    if (e.target.classList.contains("details-btn")) {
        const card = e.target.closest(".item");
        const cardId = card.dataset.id;
        const historyEntries = cardHistory[cardId] || [];
        
        // Atualiza o conteúdo do modal com o histórico formatado
        detailsModalContent.innerHTML = `
            <h2>Detalhes do Card</h2>
            <div class="history">
                ${historyEntries.length > 0 ? 
                  historyEntries.map(entry => `
                    <div class="history-item">
                        <span class="history-highlight">${entry.type}:</span> ${entry.message}
                        <span class="history-time">${entry.timestamp}</span>
                    </div>
                `).join('') :
                  '<p>Nenhum histórico disponível.</p>'
                }
            </div>
        `;
        
        detailsModal.style.display = "flex";
    }
});

detailsModal.addEventListener("click", (e) => {
    if (e.target === detailsModal) {
        detailsModal.style.display = "none"; // Esconde o modal de detalhes
    }
});

// Adiciona evento de clique para o botão de excluir
document.addEventListener("click", (e) => {
    if (e.target.classList.contains("delete-btn")) {
        const card = e.target.closest(".item");
        if (card) {
            card.remove(); // Remove o card do DOM
            saveData(); // Salva dados ao excluir o card
        }
    }
});
