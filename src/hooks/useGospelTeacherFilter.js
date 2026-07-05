import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

export const GOSPEL_TEACHER_SARVAPRIYANANDA = 'sarvapriyananda';
export const GOSPEL_TEACHER_ALL = 'all';

export function useGospelTeacherFilter() {
  const [searchParams] = useSearchParams();
  const teacher = searchParams.get('teacher');
  const showAllTeachers = teacher === GOSPEL_TEACHER_ALL;
  const sarvapriyanandaOnly = !showAllTeachers;

  const querySuffix = useMemo(
    () => (showAllTeachers ? `?teacher=${GOSPEL_TEACHER_ALL}` : ''),
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
