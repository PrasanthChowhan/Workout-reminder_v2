import React, { useState, useEffect } from "react";
import { invoke } from "../../../utils/tauri";
import { toast } from "../../../utils/toast";
import styles from "./CardBrowser.module.css";

export default function CardBrowser() {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Sort states
  const [sortField, setSortField] = useState("srs_due_date");
  const [sortAsc, setSortAsc] = useState(true);

  // Filter states
  const [search, setSearch] = useState("");
  const [filterState, setFilterState] = useState("All");

  useEffect(() => {
    loadCards();
  }, []);

  const loadCards = async () => {
    setLoading(true);
    try {
      const allCards = await invoke("get_all_recall_variants");
      setCards(allCards || []);
    } catch (err) {
      console.error("Failed to load cards for browser", err);
      toast.error("Failed to load cards.");
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const getStateLabel = (stateNum) => {
    return ["New", "Learning", "Review", "Relearning"][stateNum] || "New";
  };

  const filteredCards = cards.filter((c) => {
    if (filterState !== "All" && getStateLabel(c.srs_state) !== filterState) return false;
    
    if (search.trim()) {
      const term = search.toLowerCase();
      return (
        c.concept_title.toLowerCase().includes(term) ||
        c.scenario_prose.toLowerCase().includes(term) ||
        c.target_answer_prose.toLowerCase().includes(term)
      );
    }
    return true;
  });

  const sortedCards = [...filteredCards].sort((a, b) => {
    let valA, valB;
    switch (sortField) {
      case "concept_title":
        valA = a.concept_title.toLowerCase();
        valB = b.concept_title.toLowerCase();
        break;
      case "difficulty_level":
        valA = a.difficulty_level.toLowerCase();
        valB = b.difficulty_level.toLowerCase();
        break;
      case "srs_state":
        valA = a.srs_state;
        valB = b.srs_state;
        break;
      case "srs_due_date":
      default:
        valA = new Date(a.srs_due_date).getTime();
        valB = new Date(b.srs_due_date).getTime();
        break;
    }

    if (valA < valB) return sortAsc ? -1 : 1;
    if (valA > valB) return sortAsc ? 1 : -1;
    return 0;
  });

  return (
    <div className={styles['browser-container']}>
      <div className={styles['browser-controls']}>
        <input 
          type="text" 
          placeholder="Search cards..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={styles['search-input']}
        />
        
        <select 
          value={filterState} 
          onChange={(e) => setFilterState(e.target.value)}
          className={styles['filter-select']}
        >
          <option value="All">All States</option>
          <option value="New">New</option>
          <option value="Learning">Learning</option>
          <option value="Review">Review</option>
          <option value="Relearning">Relearning</option>
        </select>
        
        <div className={styles['stats']}>
          {sortedCards.length} {sortedCards.length === 1 ? 'card' : 'cards'}
        </div>
      </div>

      <div className={styles['table-wrapper']}>
        {loading ? (
          <div className={styles['loading']}>Loading cards...</div>
        ) : sortedCards.length === 0 ? (
          <div className={styles['empty']}>No cards match your filters.</div>
        ) : (
          <table className={styles['browser-table']}>
            <thead>
              <tr>
                <th onClick={() => handleSort("concept_title")}>
                  Topic {sortField === "concept_title" && (sortAsc ? "↑" : "↓")}
                </th>
                <th>Card / Prompt</th>
                <th onClick={() => handleSort("srs_state")}>
                  State {sortField === "srs_state" && (sortAsc ? "↑" : "↓")}
                </th>
                <th onClick={() => handleSort("difficulty_level")}>
                  Difficulty {sortField === "difficulty_level" && (sortAsc ? "↑" : "↓")}
                </th>
                <th onClick={() => handleSort("srs_due_date")}>
                  Due Date {sortField === "srs_due_date" && (sortAsc ? "↑" : "↓")}
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedCards.map((c) => {
                const isNew = c.srs_state === 0;
                const formattedDueDate = new Date(c.srs_due_date).toLocaleDateString();
                const stateLabel = getStateLabel(c.srs_state);
                
                return (
                  <tr key={c.variant_id}>
                    <td className={styles['topic-cell']}>{c.concept_title}</td>
                    <td className={styles['prompt-cell']}>{c.scenario_prose}</td>
                    <td>
                      <span className={`${styles['badge']} ${styles[stateLabel.toLowerCase()]}`}>
                        {stateLabel}
                      </span>
                    </td>
                    <td>
                      <span className={`${styles['badge']} ${styles[c.difficulty_level.toLowerCase()]}`}>
                        {c.difficulty_level}
                      </span>
                    </td>
                    <td className={styles['date-cell']}>
                      {isNew ? "Now" : formattedDueDate}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
