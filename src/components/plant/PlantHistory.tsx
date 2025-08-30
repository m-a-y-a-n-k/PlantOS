import React, { useState } from 'react';
import { usePlantStore } from '../../stores/plantStore';
import { PlantHistoryItem } from '../../types/plant';
import './PlantHistory.css';

interface PlantHistoryProps {
  onClose: () => void;
  onSelectPlant?: (plant: PlantHistoryItem) => void;
}

const PlantHistory: React.FC<PlantHistoryProps> = ({ onClose, onSelectPlant }) => {
  const { plantHistory, removeFromHistory, toggleFavorite, addNoteToPlant } = usePlantStore();
  const [filter, setFilter] = useState<'all' | 'favorites'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');

  const filteredHistory = plantHistory.filter((item) => {
    const matchesFilter = filter === 'all' || (filter === 'favorites' && item.isFavorite);
    const matchesSearch = searchTerm === '' || 
      item.plant.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.plant.scientificName && item.plant.scientificName.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesFilter && matchesSearch;
  });

  const handleAddNote = (id: string) => {
    addNoteToPlant(id, noteText);
    setEditingNote(null);
    setNoteText('');
  };

  const startEditingNote = (item: PlantHistoryItem) => {
    setEditingNote(item.id);
    setNoteText(item.notes || '');
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="plant-history-overlay">
      <div className="plant-history-modal">
        <div className="plant-history-header">
          <h2>🌱 Plant History</h2>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="plant-history-controls">
          <div className="search-container">
            <input
              type="text"
              placeholder="Search plants..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          
          <div className="filter-buttons">
            <button
              className={`filter-button ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All ({plantHistory.length})
            </button>
            <button
              className={`filter-button ${filter === 'favorites' ? 'active' : ''}`}
              onClick={() => setFilter('favorites')}
            >
              Favorites ({plantHistory.filter(item => item.isFavorite).length})
            </button>
          </div>
        </div>

        <div className="plant-history-content">
          {filteredHistory.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🔍</div>
              <h3>No plants found</h3>
              <p>
                {searchTerm 
                  ? `No plants match "${searchTerm}"`
                  : filter === 'favorites' 
                    ? "You haven't favorited any plants yet"
                    : "Start identifying plants to build your history!"
                }
              </p>
            </div>
          ) : (
            <div className="history-grid">
              {filteredHistory.map((item) => (
                <div key={item.id} className="history-card">
                  <div className="card-image-container">
                    <img
                      src={item.capturedImage}
                      alt={item.plant.label}
                      className="card-image"
                      onClick={() => onSelectPlant?.(item)}
                    />
                    <div className="card-actions">
                      <button
                        className={`favorite-button ${item.isFavorite ? 'favorited' : ''}`}
                        onClick={() => toggleFavorite(item.id)}
                        title={item.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                      >
                        {item.isFavorite ? '❤️' : '🤍'}
                      </button>
                      <button
                        className="delete-button"
                        onClick={() => removeFromHistory(item.id)}
                        title="Remove from history"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  <div className="card-content">
                    <h3 className="plant-name">{item.plant.label}</h3>
                    {item.plant.scientificName && (
                      <p className="scientific-name">
                        <em>{item.plant.scientificName}</em>
                      </p>
                    )}
                    
                    <div className="plant-meta">
                      <span className="confidence">
                        {item.plant.confidence 
                          ? `${Math.round(item.plant.confidence * 100)}% confident`
                          : 'Confidence unknown'
                        }
                      </span>
                      <span className="source">via {item.plant.source}</span>
                    </div>

                    <p className="timestamp">{formatDate(item.timestamp)}</p>

                    {/* Notes section */}
                    <div className="notes-section">
                      {editingNote === item.id ? (
                        <div className="note-editor">
                          <textarea
                            value={noteText}
                            onChange={(e) => setNoteText(e.target.value)}
                            placeholder="Add your notes about this plant..."
                            className="note-textarea"
                            rows={3}
                          />
                          <div className="note-actions">
                            <button
                              className="save-note-button"
                              onClick={() => handleAddNote(item.id)}
                            >
                              Save
                            </button>
                            <button
                              className="cancel-note-button"
                              onClick={() => {
                                setEditingNote(null);
                                setNoteText('');
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="note-display">
                          {item.notes ? (
                            <p className="note-text">{item.notes}</p>
                          ) : (
                            <p className="no-notes">No notes added</p>
                          )}
                          <button
                            className="edit-note-button"
                            onClick={() => startEditingNote(item)}
                          >
                            {item.notes ? 'Edit Note' : 'Add Note'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlantHistory;
