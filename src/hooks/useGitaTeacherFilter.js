import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

export const GITA_TEACHER_SARVAPRIYANANDA = 'sarvapriyananda';

export function useGitaTeacherFilter() {
  const [searchParams] = useSearchParams();
  const teacher = searchParams.get('teacher');
  const sarvapriyanandaOnly = teacher === GITA_TEACHER_SARVAPRIYANANDA;

  const querySuffix = useMemo(
    () => (sarvapriyanandaOnly ? `?teacher=${GITA_TEACHER_SARVAPRIYANANDA}` : ''),
    [sarvapriyanandaOnly]
  );

  return {
    teacher,
    sarvapriyanandaOnly,
    showAllTeachers: !sarvapriyanandaOnly,
    querySuffix,
    withTeacherQuery: (path) => `${path}${querySuffix}`,
  };
}
