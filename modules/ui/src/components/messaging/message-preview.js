import React from 'react';

const MessagePreview = ({ subject, body, candidate }) => {
  // Format today's date for preview
  const formatDate = () => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date().toLocaleDateString('en-US', options);
  };
  
  // Format the message body with proper line breaks
  const formatMessageBody = (text) => {
    if (!text) return '';
    
    // Split by newlines and wrap each paragraph
    return text.split('\n').map((paragraph, index) => (
      paragraph ? <p key={index} className="mb-4">{paragraph}</p> : <br key={index} />
    ));
  };
  
  return (
    <div className="space-y-4">
      {/* Preview header */}
      <div className="border-b border-gray-200 pb-3">
        <h3 className="text-lg font-medium text-gray-900">Message Preview</h3>
        <p className="text-sm text-gray-500">This is how your message will appear to the candidate</p>
      </div>
      
      {/* Email preview */}
      <div className="border border-gray-300 rounded-md overflow-hidden">
        {/* Email header */}
        <div className="bg-gray-100 p-4 border-b border-gray-300">
          <div className="mb-2">
            <span className="text-sm font-medium text-gray-700">From:</span>
            <span className="text-sm text-gray-700 ml-2">Your Name &lt;your.email@company.com&gt;</span>
          </div>
          <div className="mb-2">
            <span className="text-sm font-medium text-gray-700">To:</span>
            <span className="text-sm text-gray-700 ml-2">
              {candidate ? `${candidate.name} <${candidate.email || 'candidate@example.com'}>` : 'Candidate <candidate@example.com>'}
            </span>
          </div>
          <div className="mb-2">
            <span className="text-sm font-medium text-gray-700">Date:</span>
            <span className="text-sm text-gray-700 ml-2">{formatDate()}</span>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-700">Subject:</span>
            <span className="text-sm text-gray-700 ml-2">{subject || 'No Subject'}</span>
          </div>
        </div>
        
        {/* Email body */}
        <div className="bg-white p-4">
          <div className="prose prose-sm max-w-none">
            {formatMessageBody(body)}
          </div>
          
          {/* Signature */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-900">Best regards,</p>
            <p className="text-sm text-gray-900">Your Name</p>
            <p className="text-sm text-gray-900">Recruiter</p>
            <p className="text-sm text-gray-900">Your Company</p>
            <p className="text-sm text-gray-900">your.email@company.com</p>
          </div>
        </div>
      </div>
      
      {/* No recipient warning */}
      {!candidate && (
        <div className="rounded-md bg-yellow-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">No recipient selected</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  Please select a candidate to send this message to.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessagePreview;