import React, { useState, useEffect } from 'react';
import { 
  PlusCircleIcon, 
  TrashIcon,
  ArrowSmallUpIcon,
  ArrowSmallDownIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';

const EvaluationCriteriaSettings = ({ criteria, onUpdate, saving }) => {
  const [evaluationCriteria, setEvaluationCriteria] = useState([]);
  const [error, setError] = useState(null);
  
  // Initialize from props
  useEffect(() => {
    if (criteria) {
      setEvaluationCriteria([...criteria]);
    }
  }, [criteria]);
  
  // Add new criterion
  const addCriterion = () => {
    const newCriterion = {
      id: `criteria-${Date.now()}`,
      name: 'New Criterion',
      description: 'Description of this evaluation criterion',
      weight: 10
    };
    
    setEvaluationCriteria([...evaluationCriteria, newCriterion]);
  };
  
  // Remove criterion
  const removeCriterion = (id) => {
    setEvaluationCriteria(evaluationCriteria.filter(c => c.id !== id));
  };
  
  // Update criterion field
  const updateCriterion = (id, field, value) => {
    setEvaluationCriteria(
      evaluationCriteria.map(c => 
        c.id === id ? { ...c, [field]: value } : c
      )
    );
  };
  
  // Move criterion up
  const moveCriterionUp = (index) => {
    if (index === 0) return;
    
    const newCriteria = [...evaluationCriteria];
    const temp = newCriteria[index];
    newCriteria[index] = newCriteria[index - 1];
    newCriteria[index - 1] = temp;
    
    setEvaluationCriteria(newCriteria);
  };
  
  // Move criterion down
  const moveCriterionDown = (index) => {
    if (index === evaluationCriteria.length - 1) return;
    
    const newCriteria = [...evaluationCriteria];
    const temp = newCriteria[index];
    newCriteria[index] = newCriteria[index + 1];
    newCriteria[index + 1] = temp;
    
    setEvaluationCriteria(newCriteria);
  };
  
  // Save changes
  const saveChanges = () => {
    // Validate total weight is 100
    const totalWeight = evaluationCriteria.reduce((sum, c) => sum + c.weight, 0);
    
    if (totalWeight !== 100) {
      setError(`Total weight must be 100%. Current total: ${totalWeight}%`);
      return;
    }
    
    // Clear any errors
    setError(null);
    
    // Call update function
    onUpdate(evaluationCriteria);
  };
  
  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-lg font-medium text-gray-900">
          Candidate Evaluation Criteria
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Customize the criteria used to evaluate candidates. The total weights must add up to 100%.
        </p>
      </div>
      
      {/* Error message */}
      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <ExclamationCircleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">{error}</h3>
            </div>
          </div>
        </div>
      )}
      
      {/* Criteria list */}
      <div className="space-y-4 mb-6">
        {evaluationCriteria.map((criterion, index) => (
          <div key={criterion.id} className="border border-gray-200 rounded-md p-4">
            <div className="grid grid-cols-6 gap-4">
              {/* Name */}
              <div className="col-span-3">
                <label htmlFor={`name-${criterion.id}`} className="block text-sm font-medium text-gray-700">
                  Name
                </label>
                <input
                  type="text"
                  id={`name-${criterion.id}`}
                  value={criterion.name}
                  onChange={(e) => updateCriterion(criterion.id, 'name', e.target.value)}
                  className="mt-1 focus:ring-linkedin-blue focus:border-linkedin-blue block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                />
              </div>
              
              {/* Weight */}
              <div className="col-span-2">
                <label htmlFor={`weight-${criterion.id}`} className="block text-sm font-medium text-gray-700">
                  Weight (%)
                </label>
                <input
                  type="number"
                  id={`weight-${criterion.id}`}
                  value={criterion.weight}
                  min="1"
                  max="100"
                  onChange={(e) => updateCriterion(criterion.id, 'weight', parseInt(e.target.value, 10) || 0)}
                  className="mt-1 focus:ring-linkedin-blue focus:border-linkedin-blue block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                />
              </div>
              
              {/* Actions */}
              <div className="col-span-1 flex items-end justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => moveCriterionUp(index)}
                  disabled={index === 0}
                  className="text-gray-500 hover:text-gray-700 disabled:opacity-50"
                >
                  <ArrowSmallUpIcon className="h-5 w-5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => moveCriterionDown(index)}
                  disabled={index === evaluationCriteria.length - 1}
                  className="text-gray-500 hover:text-gray-700 disabled:opacity-50"
                >
                  <ArrowSmallDownIcon className="h-5 w-5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => removeCriterion(criterion.id)}
                  disabled={evaluationCriteria.length <= 1}
                  className="text-red-500 hover:text-red-700 disabled:opacity-50"
                >
                  <TrashIcon className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
              
              {/* Description */}
              <div className="col-span-6">
                <label htmlFor={`description-${criterion.id}`} className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  id={`description-${criterion.id}`}
                  value={criterion.description}
                  onChange={(e) => updateCriterion(criterion.id, 'description', e.target.value)}
                  rows={2}
                  className="mt-1 focus:ring-linkedin-blue focus:border-linkedin-blue block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Add new criterion */}
      <div className="mb-6">
        <button
          type="button"
          onClick={addCriterion}
          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-linkedin-blue"
        >
          <PlusCircleIcon className="-ml-0.5 mr-2 h-4 w-4" aria-hidden="true" />
          Add Criterion
        </button>
      </div>
      
      {/* Actions */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={saveChanges}
          disabled={saving}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-linkedin-blue hover:bg-linkedin-dark-blue focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-linkedin-blue disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
};

export default EvaluationCriteriaSettings;