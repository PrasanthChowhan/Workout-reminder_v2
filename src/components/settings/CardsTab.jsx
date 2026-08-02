import React, { useState } from "react";

/**
 * CardsTab renders the active recall cards CRUD list.
 * 
 * @param {object} props
 * @param {Array} props.editableCards List of recall card objects
 * @param {function} props.setEditableCards Callback to update the recall cards list
 */
export default function CardsTab({ editableCards, setEditableCards }) {
  const [newCard, setNewCard] = useState({ category: "", question: "", answer: "" });

  const handleAddCard = () => {
    if (!newCard.category.trim() || !newCard.question.trim() || !newCard.answer.trim()) return;
    const card = {
      id: Math.random().toString(36).substring(2, 9),
      category: newCard.category.trim(),
      question: newCard.question.trim(),
      answer: newCard.answer.trim(),
      source: null
    };
    setEditableCards([...editableCards, card]);
    setNewCard({ category: "", question: "", answer: "" });
  };

  const handleDeleteCard = (id) => {
    setEditableCards(editableCards.filter(c => c.id !== id));
  };

  return (
    <div className="tab-pane">
      <div className="settings-add-form">
        <h3 className="settings-group-title" style={{ marginTop: 0, borderBottom: "none" }}>Add Active Recall Card</h3>
        <div className="add-form-row">
          <input 
            type="text" 
            placeholder="Category (e.g., Rust)" 
            className="settings-input-text" 
            value={newCard.category}
            onChange={(e) => setNewCard({ ...newCard, category: e.target.value })}
          />
          <input 
            type="text" 
            placeholder="Question" 
            className="settings-input-text" 
            value={newCard.question}
            onChange={(e) => setNewCard({ ...newCard, question: e.target.value })}
          />
        </div>
        <div className="add-form-row" style={{ marginTop: "0.5rem" }}>
          <input 
            type="text" 
            placeholder="Answer" 
            className="settings-input-text" 
            value={newCard.answer}
            onChange={(e) => setNewCard({ ...newCard, answer: e.target.value })}
          />
          <button type="button" className="settings-add-btn" onClick={handleAddCard}>Add Card</button>
        </div>
      </div>

      <div className="settings-items-list">
        {editableCards.map((card) => (
          <div key={card.id} className="settings-list-item">
            <div className="settings-item-info">
              <span className="settings-item-badge">{card.category}</span>
              <h4 className="settings-item-title">{card.question}</h4>
              <p className="settings-item-desc">{card.answer}</p>
            </div>
            <button type="button" className="settings-item-delete" onClick={() => handleDeleteCard(card.id)} title="Delete Card">
              <svg fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="16" xmlns="http://www.w3.org/2000/svg">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
