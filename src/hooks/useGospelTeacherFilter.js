import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

export const GOSPEL_TEACHER_SARVAPRIYANANDA = 'sarvapriyananda';

export function useGospelTeacherFilter() {
  const [searchParams] = useSearchParams();
  const teacher = searchParams.get('teacher');
  const sarvapriyanandaOnly = teacher === GOSPEL_TEACHER_SARVAPRIYANANDA;

  const querySuffix = useMemo(
    () => (sarvapriyanandaOnly ? `?teacher=${GOSPEL_TEACHER_SARVAPRIYANANDA}` : ''),
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
