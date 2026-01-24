import React, { useState, useEffect } from 'react';
import './ProgressBar.css';

function ProgressBar({ loading, message, prominent = false }) {
  const [progress, setProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState('searching_questions');
  const [stageMessage, setStageMessage] = useState('Searching Q&A database...');

  const stages = [
    { key: 'searching_questions', message: 'Searching Q&A database by topics...', duration: 3000, progress: 20 },
    { key: 'filtering_relevance', message: 'Filtering results for relevance...', duration: 5000, progress: 50 },
    { key: 'searching_videos', message: 'Searching YouTube videos...', duration: 4000, progress: 70 },
    { key: 'checking_relevance', message: 'Checking video relevance...', duration: 3000, progress: 85 },
    { key: 'gathering_options', message: 'Gathering similar questions and options...', duration: 2000, progress: 95 },
  ];

  useEffect(() => {
    if (!loading) {
      setProgress(0);
      setCurrentStage('searching_questions');
      setStageMessage('Searching Q&A database...');
      return;
    }

    let startTime = Date.now();
    let stageIndex = 0;
    let accumulatedProgress = 0;
    let timeoutId;

    const updateProgress = () => {
      if (!loading) {
        return;
      }

      const elapsed = Date.now() - startTime;
      const currentStageData = stages[stageIndex];
      const stageElapsed = elapsed - (stageIndex > 0 ? stages.slice(0, stageIndex).reduce((sum, s) => sum + s.duration, 0) : 0);
      
      // Calculate progress within current stage
      const stageProgress = Math.min(stageElapsed / currentStageData.duration, 1);
      const stageContribution = currentStageData.progress - (stageIndex > 0 ? stages[stageIndex - 1].progress : 0);
      const currentProgress = accumulatedProgress + (stageProgress * stageContribution);
      
      setProgress(Math.min(currentProgress, 95)); // Cap at 95% until we get response
      setCurrentStage(currentStageData.key);
      setStageMessage(currentStageData.message || message || 'Searching...');

      // Move to next stage if current stage duration has passed
      const totalStageTime = stages.slice(0, stageIndex + 1).reduce((sum, s) => sum + s.duration, 0);
      if (elapsed >= totalStageTime && stageIndex < stages.length - 1) {
        accumulatedProgress = currentStageData.progress;
        stageIndex++;
        startTime = Date.now() - (elapsed - totalStageTime);
      }

      timeoutId = setTimeout(updateProgress, 100);
    };

    updateProgress();

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [loading, message]);

  // Reset to 100% when loading completes
  useEffect(() => {
    if (!loading && progress > 0) {
      setProgress(100);
      setTimeout(() => setProgress(0), 500);
    }
  }, [loading, progress]);

  if (!loading) {
    return null;
  }

  return (
    <div className={`progress-bar-container ${prominent ? 'prominent' : ''}`}>
      <div className="progress-bar-message">{stageMessage}</div>
      <div className="progress-bar-wrapper">
        <div 
          className={`progress-bar-fill ${prominent ? 'prominent' : ''}`}
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="progress-bar-percentage">{Math.round(progress)}%</div>
    </div>
  );
}

export default ProgressBar;