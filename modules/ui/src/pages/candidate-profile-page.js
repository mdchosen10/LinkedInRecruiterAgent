import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../contexts/data-context';

// Components
import CandidateHeader from '../components/candidates/candidate-header';
import CandidateExperience from '../components/candidates/candidate-experience';
import CandidateEducation from '../components/candidates/candidate-education';
import CandidateSkills from '../components/candidates/candidate-skills';
import CandidateEvaluation from '../components/candidates/candidate-evaluation';
import CandidateNotes from '../components/candidates/candidate-notes';
import CandidateActions from '../components/candidates/candidate-actions';

// Icons
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

const CandidateProfilePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const { getCandidateById, updateCandidate, evaluationCriteria } = useData();
  
  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  
  // Load candidate data
  useEffect(() => {
    setLoading(true);
    setError(null);
    
    const candidateData = getCandidateById(id);
    if (candidateData) {
      setCandidate(candidateData);
      setLoading(false);
    } else {
      setError('Candidate not found');
      setLoading(false);
    }
  }, [id, getCandidateById]);
  
  // Handle notes update
  const handleNotesUpdate = async (notes) => {
    setSaving(true);
    try {
      updateCandidate(id, { notes });
      setCandidate(prev => ({ ...prev, notes }));
    } catch (err) {
      console.error('Error updating notes:', err);
      setError('Failed to update notes. Please try again.');
    } finally {
      setSaving(false);
    }
  };
  
  // Handle evaluation update
  const handleEvaluationUpdate = async (evaluations) => {
    setSaving(true);
    try {
      // Calculate new overall score based on criteria weights
      const totalWeight = evaluationCriteria.reduce((sum, criteria) => sum + criteria.weight, 0);
      
      let newScore = 0;
      for (const criteria of evaluationCriteria) {
        if (evaluations[criteria.id]) {
          newScore += (evaluations[criteria.id] * criteria.weight) / totalWeight;
        }
      }
      
      newScore = Math.round(newScore);
      
      updateCandidate(id, { 
        evaluations, 
        score: newScore 
      });
      
      setCandidate(prev => ({ 
        ...prev, 
        evaluations, 
        score: newScore 
      }));
    } catch (err) {
      console.error('Error updating evaluation:', err);
      setError('Failed to update evaluation. Please try again.');
    } finally {
      setSaving(false);
    }
  };
  
  // Handle status update
  const handleStatusUpdate = async (status) => {
    setSaving(true);
    try {
      updateCandidate(id, { status });
      setCandidate(prev => ({ ...prev, status }));
    } catch (err) {
      console.error('Error updating status:', err);
      setError('Failed to update status. Please try again.');
    } finally {
      setSaving(false);
    }
  };
  
  // Handle back navigation
  const handleBack = () => {
    navigate(-1);
  };
  
  if (loading) {
    return (
      <div className="py-12 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-linkedin-blue"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-md">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">{error}</h3>
            <div className="mt-2">
              <button
                type="button"
                onClick={handleBack}
                className="text-sm font-medium text-red-800 hover:text-red-700"
              >
                Go back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (!candidate) {
    return (
      <div className="text-center py-12">
        <h3 className="mt-2 text-lg font-medium text-gray-900">Candidate not found</h3>
        <p className="mt-1 text-sm text-gray-500">The candidate you're looking for doesn't exist or has been removed.</p>
        <div className="mt-6">
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-linkedin-blue hover:bg-linkedin-dark-blue focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-linkedin-blue"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Back button */}
      <button
        type="button"
        onClick={handleBack}
        className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-linkedin-blue"
      >
        <ArrowLeftIcon className="-ml-1 mr-2 h-4 w-4" aria-hidden="true" />
        Back
      </button>
      
      {/* Candidate header */}
      <CandidateHeader 
        candidate={candidate} 
        onStatusChange={handleStatusUpdate}
        saving={saving}
      />
      
      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Experience */}
          <div className="card">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Experience</h2>
            <CandidateExperience experience={candidate.experience} />
          </div>
          
          {/* Education */}
          <div className="card">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Education</h2>
            <CandidateEducation education={candidate.education} />
          </div>
          
          {/* Skills */}
          <div className="card">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Skills</h2>
            <CandidateSkills skills={candidate.skills} />
          </div>
          
          {/* Notes */}
          <div className="card">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Notes</h2>
            <CandidateNotes 
              notes={candidate.notes} 
              onUpdate={handleNotesUpdate}
              saving={saving}
            />
          </div>
        </div>
        
        {/* Right column */}
        <div className="space-y-6">
          {/* Actions */}
          <CandidateActions 
            candidate={candidate} 
          />
          
          {/* Evaluation */}
          <div className="card">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Evaluation</h2>
            <CandidateEvaluation 
              evaluations={candidate.evaluations} 
              criteria={evaluationCriteria}
              onUpdate={handleEvaluationUpdate}
              saving={saving}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CandidateProfilePage;