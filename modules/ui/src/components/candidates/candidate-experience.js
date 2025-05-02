import React from 'react';

const CandidateExperience = ({ experience }) => {
  if (!experience || experience.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-gray-500">No experience information available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {experience.map((exp, index) => (
        <div 
          key={index} 
          className={`pb-4 ${index < experience.length - 1 ? 'border-b border-gray-200' : ''}`}
        >
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-base font-medium text-gray-900">{exp.title}</h3>
              <p className="text-sm text-gray-600">{exp.company}</p>
            </div>
            <span className="text-sm text-gray-500">{exp.duration}</span>
          </div>
          <p className="mt-2 text-sm text-gray-700">{exp.description}</p>
        </div>
      ))}
    </div>
  );
};

export default CandidateExperience;