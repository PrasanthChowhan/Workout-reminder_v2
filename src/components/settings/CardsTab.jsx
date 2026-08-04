import React, { useState } from "react";
import { toast } from "../../utils/toast";
import { TrashIcon } from "../ui/Icons";
import styles from "./CardsTab.module.css";

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
      id: crypto.randomUUID(), // Complies with RULE-C5 (use crypto.randomUUID() for IDs)
      category: newCard.category.trim(),
      question: newCard.question.trim(),
      answer: newCard.answer.trim(),
      source: null
    };
    setEditableCards([...editableCards, card]);
    setNewCard({ category: "", question: "", answer: "" });
    toast.success("Recall card added successfully!");
  };

  const handleDeleteCard = (id) => {
    setEditableCards(editableCards.filter(c => c.id !== id));
    toast.info("Recall card deleted.");
  };

  return (
    <div className={styles['tab-pane']}>
      <div className={styles['settings-add-form']}>
        <h3 className={styles['settings-group-title']} style={{ marginTop: 0, borderBottom: "none" }}>
          Add Active Recall Card
        </h3>
        <div className={styles['add-form-row']}>
          <input 
            type="text" 
            placeholder="Category (e.g., Rust)" 
            className={styles['settings-input-text']} 
            value={newCard.category}
            onChange={(e) => setNewCard({ ...newCard, category: e.target.value })}
          />
          <input 
            type="text" 
            placeholder="Question" 
            className={styles['settings-input-text']} 
            value={newCard.question}
            onChange={(e) => setNewCard({ ...newCard, question: e.target.value })}
          />
        </div>
        <div className={styles['add-form-row']} style={{ marginTop: "0.5rem" }}>
          <input 
            type="text" 
            placeholder="Answer" 
            className={styles['settings-input-text']} 
            value={newCard.answer}
            onChange={(e) => setNewCard({ ...newCard, answer: e.target.value })}
          />
          <button type="button" className={styles['settings-add-btn']} onClick={handleAddCard}>
            Add Card
          </button>
        </div>
      </div>

      <div className={styles['settings-items-list']}>
        {editableCards.map((card) => (
          <div key={card.id} className={styles['settings-list-item']}>
            <div className={styles['settings-item-info']}>
              <span className={styles['settings-item-badge']}>{card.category}</span>
              <h4 className={styles['settings-item-title']}>{card.question}</h4>
              <p className={styles['settings-item-desc']}>{card.answer}</p>
            </div>
            <button 
              type="button" 
              className={styles['settings-item-delete']} 
              onClick={() => handleDeleteCard(card.id)} 
              title="Delete Card"
            >
              <TrashIcon />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
