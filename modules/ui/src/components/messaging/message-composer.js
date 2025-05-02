import React, { useState, useEffect } from 'react';

const MessageComposer = ({ subject, body, onSubjectChange, onBodyChange, templateVariables }) => {
  const [highlightedText, setHighlightedText] = useState('');
  
  // Highlight template variables in text fields
  useEffect(() => {
    const variables = Object.keys(templateVariables || {}).map(v => `{{${v}}}`);
    setHighlightedText(variables.join('|'));
  }, [templateVariables]);
  
  // Format text with variable highlighting
  const formatTextWithHighlights = (text) => {
    if (!highlightedText || !text) return text;
    
    // Create a regex pattern with all variables
    const pattern = new RegExp(`(${highlightedText})`, 'g');
    
    // Split text by matches and wrap matches in a span
    const parts = text.split(pattern);
    
    return parts.map((part, index) => {
      // Check if this part matches any variable pattern
      const isVariable = part.match(/^{{.*}}$/);
      
      if (isVariable) {
        return (
          <span 
            key={index}
            className="bg-linkedin-lightest-blue text-linkedin-blue rounded px-1 whitespace-nowrap"
          >
            {part}
          </span>
        );
      }
      
      return part;
    });
  };
  
  return (
    <div className="space-y-4">
      {/* Subject field */}
      <div>
        <label htmlFor="subject" className="block text-sm font-medium text-gray-700">
          Subject
        </label>
        <div className="mt-1">
          <input
            type="text"
            id="subject"
            className="shadow-sm focus:ring-linkedin-blue focus:border-linkedin-blue block w-full sm:text-sm border-gray-300 rounded-md"
            value={subject}
            onChange={(e) => onSubjectChange(e.target.value)}
          />
        </div>
      </div>
      
      {/* Message body */}
      <div>
        <label htmlFor="message" className="block text-sm font-medium text-gray-700">
          Message
        </label>
        <div className="mt-1">
          <textarea
            id="message"
            rows={12}
            className="shadow-sm focus:ring-linkedin-blue focus:border-linkedin-blue block w-full sm:text-sm border-gray-300 rounded-md"
            value={body}
            onChange={(e) => onBodyChange(e.target.value)}
          />
        </div>
      </div>
      
      {/* Message preview with highlighted variables */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-2">
          Preview With Variables
        </h3>
        <div className="border border-gray-300 rounded-md p-3 bg-gray-50 prose prose-sm max-w-none whitespace-pre-wrap">
          {formatTextWithHighlights(body)}
        </div>
      </div>
      
      {/* Available variables */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-2">
          Available Variables
        </h3>
        <div className="flex flex-wrap gap-2">
          {Object.keys(templateVariables || {}).map((key) => (
            <div
              key={key}
              className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-gray-100 text-gray-800"
            >
              <span className="font-medium mr-1">{'{{' + key + '}}'}:</span>
              <span className="text-gray-600 truncate max-w-xs">
                {templateVariables[key] || '[empty]'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MessageComposer;