import React, { useState } from 'react';

const CandidateEvaluation = ({ evaluations, criteria, onUpdate, saving }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [scores, setScores] = useState(evaluations || {});
  
  // Handle score change
  const handleScoreChange = (criteriaId, value) => {
    setScores((prev) => ({
      ...prev,
      [criteriaId]: parseInt(value, 10)
    }));
  };
  
  // Save changes
  const saveChanges = () => {
    onUpdate(scores);
    setIsEditing(false);
  };
  
  // Cancel editing
  const cancelEditing = () => {
    setScores(evaluations);
    setIsEditing(false);
  };
  
  // Get color for score
  const getScoreColor = (score) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-blue-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };
  
  // Get color for progress bar
  const getProgressColor = (score) => {
    if (score >= 90) return 'bg-green-500';
    if (score >= 75) return 'bg-blue-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };
  
  // Render score display for each criteria
  const renderScoreDisplay = (criteriaItem) => {
    const score = evaluations?.[criteriaItem.id] || 0;
    const scoreColor = getScoreColor(score);
    const progressColor = getProgressColor(score);
    
    return (
      <div key={criteriaItem.id} className="mb-4">
        <div className="flex justify-between items-center mb-1">
          <div className="text-sm font-medium text-gray-700">
            {criteriaItem.name}
          </div>
          <div className={`text-sm font-medium ${scoreColor}`}>
            {score}/100
          </div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`${progressColor} h-2 rounded-full`}
            style={{ width: `${score}%` }}
          ></div>
        </div>
        <div className="mt-1 text-xs text-gray-500">
          {criteriaItem.description}
        </div>
      </div>
    );
  };
  
  // Render score editor for each criteria
  const renderScoreEditor = (criteriaItem) => {
    return (
      <div key={criteriaItem.id} className="mb-4">
        <div className="flex justify-between items-center mb-1">
          <label 
            htmlFor={`criteria-${criteriaItem.id}`}
            className="text-sm font-medium text-gray-700"
          >
            {criteriaItem.name} ({criteriaItem.weight}%)
          </label>
          <div className="text-sm font-medium text-gray-700">
            {scores[criteriaItem.id] || 0}/100
          </div>
        </div>
        <input
          type="range"
          id={`criteria-${criteriaItem.id}`}
          min="0"
          max="100"
          step="5"
          value={scores[criteriaItem.id] || 0}
          onChange={(e) => handleScoreChange(criteriaItem.id, e.target.value)}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
        <div className="mt-1 text-xs text-gray-500">
          {criteriaItem.description}
        </div>
      </div>
    );
  };
  
  return (
    <div>
      {/* Edit/Save buttons */}
      <div className="flex justify-end mb-4">
        {isEditing ? (
          <div className="space-x-2">
            <button
              type="button"
              onClick={saveChanges}
              disabled={saving}
              className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-linkedin-blue hover:bg-linkedin-dark-blue focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-linkedin-blue disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button
              type="button"
              onClick={cancelEditing}
              disabled={saving}
              className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-linkedin-blue disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-linkedin-blue"
          >
            Edit Evaluation
          </button>
        )}
      </div>
      
      {/* Evaluation criteria */}
      <div>
        {criteria.map((criteriaItem) => (
          isEditing 
            ? renderScoreEditor(criteriaItem)
            : renderScoreDisplay(criteriaItem)
        ))}
      </div>
    </div>
  );
};

export default CandidateEvaluation;