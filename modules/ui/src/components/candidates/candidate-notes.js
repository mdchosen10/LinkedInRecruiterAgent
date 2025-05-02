import React, { useState } from 'react';
import { PencilIcon } from '@heroicons/react/24/outline';

const CandidateNotes = ({ notes, onUpdate, saving }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [noteText, setNoteText] = useState(notes || '');
  
  // Handle save
  const handleSave = () => {
    onUpdate(noteText);
    setIsEditing(false);
  };
  
  // Handle cancel
  const handleCancel = () => {
    setNoteText(notes);
    setIsEditing(false);
  };
  
  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-base font-medium text-gray-900">Notes</h3>
        {!isEditing && (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="inline-flex items-center text-sm text-linkedin-blue hover:text-linkedin-dark-blue"
          >
            <PencilIcon className="h-4 w-4 mr-1" />
            Edit Notes
          </button>
        )}
      </div>
      
      {/* Display or edit notes */}
      {isEditing ? (
        <div>
          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            rows={5}
            className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-linkedin-blue focus:border-linkedin-blue sm:text-sm"
            placeholder="Add notes about this candidate..."
          ></textarea>
          
          <div className="mt-3 flex justify-end space-x-2">
            <button
              type="button"
              onClick={handleCancel}
              disabled={saving}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-linkedin-blue disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-linkedin-blue hover:bg-linkedin-dark-blue focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-linkedin-blue disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Notes'}
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 rounded-md p-3 min-h-[100px]">
          {notes ? (
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{notes}</p>
          ) : (
            <p className="text-sm italic text-gray-500">No notes added yet.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default CandidateNotes;