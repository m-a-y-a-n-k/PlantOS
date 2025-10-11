import React, { useState, useMemo, useCallback } from 'react';
import { usePlantStore } from '../../stores/plantStore';
import { PlantHistoryItem } from '../../types/plant';
import OptimizedImage from '../common/OptimizedImage';
import './PlantHistory.css';

interface PlantHistoryProps {
  onClose: () => void;
  onSelectPlant?: (plant: PlantHistoryItem) => void;
}

const PlantHistory: React.FC<PlantHistoryProps> = React.memo(({ onClose, onSelectPlant }) => {
  const { plantHistory, removeFromHistory, toggleFavorite, addNoteToPlant } = usePlantStore();
  const [filter, setFilter] = useState<'all' | 'favorites'>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [noteText, setNoteText] = useState<string>('');

  const filteredHistory = useMemo(() => 
    plantHistory.filter((item) => {
      const matchesFilter = filter === 'all' || (filter === 'favorites' && item.isFavorite);
      const matchesSearch = searchTerm === '' || 
        item.plant.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.plant.scientificName && item.plant.scientificName.toLowerCase().includes(searchTerm.toLowerCase()));
      
      return matchesFilter && matchesSearch;
    }), 
    [plantHistory, filter, searchTerm]
  );

  const handleAddNote = useCallback((id: string) => {
    addNoteToPlant(id, noteText);
    setEditingNote(null);
    setNoteText('');
  }, [addNoteToPlant, noteText]);

  const startEditingNote = useCallback((item: PlantHistoryItem) => {
    setEditingNote(item.id);
    setNoteText(item.notes || '');
  }, []);

  const formatDate = useCallback((timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, []);

  const updateFilter = useCallback((filter: 'all' | 'favorites') => () => {
    setFilter(filter);
  }, []);

  const updateSelectPlant = useCallback((item: PlantHistoryItem) => () => {
    onSelectPlant?.(item);
  }, [onSelectPlant]);

  const updateToggleFavorite = useCallback((id: string) => () => {
    toggleFavorite(id);
  }, [toggleFavorite]);

  const updateRemoveFromHistory = useCallback((id: string) => () => {
    removeFromHistory(id);
  }, [removeFromHistory]);

  const updateHandleAddNote = useCallback((id: string) => () => {
    handleAddNote(id);
  }, [handleAddNote]);

  const updateStartEditingNote = useCallback((item: PlantHistoryItem) => () => {  
    startEditingNote(item);
  }, [startEditingNote]);

  const cancelEditingNote = useCallback(() => {
    setEditingNote(null);
    setNoteText('');
  }, []);

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
              onClick={updateFilter('all')}
            >
              All ({plantHistory.length})
            </button>
            <button
              className={`filter-button ${filter === 'favorites' ? 'active' : ''}`}
              onClick={updateFilter('favorites')}
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
                    <OptimizedImage
                      src={item.capturedImage}
                      alt={item.plant.label}
                      className="card-image"
                      loading="lazy"
                      quality={0.6}
                      onClick={updateSelectPlant(item)}
                    />
                    <div className="card-actions">
                      <button
                        className={`favorite-button ${item.isFavorite ? 'favorited' : ''}`}
                        onClick={updateToggleFavorite(item.id)}
                        title={item.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                      >
                        {item.isFavorite ? '❤️' : '🤍'}
                      </button>
                      <button
                        className="delete-button"
                        onClick={updateRemoveFromHistory(item.id)}
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
                              onClick={updateHandleAddNote(item.id)}
                            >
                              Save
                            </button>
                            <button
                              className="cancel-note-button"
                              onClick={cancelEditingNote}
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
                            onClick={updateStartEditingNote(item)}
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
});

PlantHistory.displayName = 'PlantHistory';

export default PlantHistory;
