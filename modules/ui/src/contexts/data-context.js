import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useAuth } from './auth-context';

// Sample data (would come from API in production)
import { 
  getSampleCandidates, 
  getSampleEvaluationCriteria 
} from '../services/sample-data';

// Create context
const DataContext = createContext(null);

// Provider component
export const DataProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  
  // State for candidates
  const [candidates, setCandidates] = useState([]);
  const [filteredCandidates, setFilteredCandidates] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [candidatesLoading, setCandidatesLoading] = useState(false);
  
  // State for evaluation criteria
  const [evaluationCriteria, setEvaluationCriteria] = useState([]);
  const [criteriaLoading, setCriteriaLoading] = useState(false);
  
  // State for filters
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    minScore: 0,
    skills: []
  });
  
  // Load candidates
  const loadCandidates = useCallback(async () => {
    if (!isAuthenticated) return;
    
    setCandidatesLoading(true);
    try {
      // In production, this would be an API call
      const data = await getSampleCandidates();
      setCandidates(data);
      applyFilters(data, filters);
    } catch (error) {
      console.error('Error loading candidates:', error);
    } finally {
      setCandidatesLoading(false);
    }
  }, [isAuthenticated, filters]);
  
  // Load evaluation criteria
  const loadEvaluationCriteria = useCallback(async () => {
    if (!isAuthenticated) return;
    
    setCriteriaLoading(true);
    try {
      // In production, this would be an API call
      const data = await getSampleEvaluationCriteria();
      setEvaluationCriteria(data);
    } catch (error) {
      console.error('Error loading evaluation criteria:', error);
    } finally {
      setCriteriaLoading(false);
    }
  }, [isAuthenticated]);
  
  // Apply filters to candidates
  const applyFilters = useCallback((candidateList, filterOptions) => {
    let filtered = [...candidateList];
    
    // Apply search filter
    if (filterOptions.search) {
      const searchLower = filterOptions.search.toLowerCase();
      filtered = filtered.filter(candidate => 
        candidate.name.toLowerCase().includes(searchLower) ||
        candidate.title.toLowerCase().includes(searchLower) ||
        candidate.company.toLowerCase().includes(searchLower) ||
        candidate.skills.some(skill => skill.toLowerCase().includes(searchLower))
      );
    }
    
    // Apply status filter
    if (filterOptions.status !== 'all') {
      filtered = filtered.filter(candidate => candidate.status === filterOptions.status);
    }
    
    // Apply minimum score filter
    if (filterOptions.minScore > 0) {
      filtered = filtered.filter(candidate => candidate.score >= filterOptions.minScore);
    }
    
    // Apply skills filter
    if (filterOptions.skills.length > 0) {
      filtered = filtered.filter(candidate => 
        filterOptions.skills.every(skill => 
          candidate.skills.some(candidateSkill => 
            candidateSkill.toLowerCase() === skill.toLowerCase()
          )
        )
      );
    }
    
    setFilteredCandidates(filtered);
  }, []);
  
  // Update filters
  const updateFilters = useCallback((newFilters) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    applyFilters(candidates, updatedFilters);
  }, [filters, candidates, applyFilters]);
  
  // Get a candidate by ID
  const getCandidateById = useCallback((id) => {
    return candidates.find(candidate => candidate.id === id) || null;
  }, [candidates]);
  
  // Update a candidate
  const updateCandidate = useCallback((id, updates) => {
    setCandidates(prevCandidates => {
      const updatedCandidates = prevCandidates.map(candidate => 
        candidate.id === id ? { ...candidate, ...updates } : candidate
      );
      applyFilters(updatedCandidates, filters);
      return updatedCandidates;
    });
  }, [filters, applyFilters]);
  
  // Update evaluation criteria
  const updateEvaluationCriteria = useCallback((updatedCriteria) => {
    setEvaluationCriteria(updatedCriteria);
  }, []);
  
  // Load data when auth state changes
  useEffect(() => {
    if (isAuthenticated) {
      loadCandidates();
      loadEvaluationCriteria();
    }
  }, [isAuthenticated, loadCandidates, loadEvaluationCriteria]);
  
  // Context value
  const value = {
    // Candidates
    candidates,
    filteredCandidates,
    selectedCandidate,
    candidatesLoading,
    loadCandidates,
    getCandidateById,
    updateCandidate,
    setSelectedCandidate,
    
    // Filters
    filters,
    updateFilters,
    
    // Evaluation criteria
    evaluationCriteria,
    criteriaLoading,
    updateEvaluationCriteria
  };
  
  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

// Custom hook for using data context
export const useData = () => {
  const context = useContext(DataContext);
  
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  
  return context;
};