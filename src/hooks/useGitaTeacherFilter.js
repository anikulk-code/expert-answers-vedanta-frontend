import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

export const GITA_TEACHER_SARVAPRIYANANDA = 'sarvapriyananda';
export const GITA_TEACHER_ALL = 'all';

export function useGitaTeacherFilter() {
  const [searchParams] = useSearchParams();
  const teacher = searchParams.get('teacher');
  const showAllTeachers = teacher === GITA_TEACHER_ALL;
  const sarvapriyanandaOnly = !showAllTeachers;

  const querySuffix = useMemo(
    () => (showAllTeachers ? `?teacher=${GITA_TEACHER_ALL}` : ''),
    [showAllTeachers]
  );

  return {
    teacher,
    sarvapriyanandaOnly,
    showAllTeachers,
    querySuffix,
    withTeacherQuery: (path) => `${path}${querySuffix}`,
  };
}
