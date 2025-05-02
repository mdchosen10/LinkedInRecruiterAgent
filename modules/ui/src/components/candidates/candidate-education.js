import React from 'react';

const CandidateEducation = ({ education }) => {
  if (!education || education.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-gray-500">No education information available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {education.map((edu, index) => (
        <div 
          key={index} 
          className={`pb-4 ${index < education.length - 1 ? 'border-b border-gray-200' : ''}`}
        >
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-base font-medium text-gray-900">{edu.degree}</h3>
              <p className="text-sm text-gray-600">{edu.school}</p>
            </div>
            <span className="text-sm text-gray-500">{edu.year}</span>
          </div>
          {edu.description && (
            <p className="mt-2 text-sm text-gray-700">{edu.description}</p>
          )}
        </div>
      ))}
    </div>
  );
};

export default CandidateEducation;