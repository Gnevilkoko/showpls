import { useEffect, useState } from 'react';

const NavigationSkeleton = () => {
  const [size, setSize] = useState<{ width: string; height: string }>({
    width: '0px',
    height: '0px',
  });

  useEffect(() => {
    const el = document.querySelector('.navigation') as HTMLElement | null;
    if (!el) return; // если элемент ещё не смонтирован, просто выходим

    const styles = getComputedStyle(el);
    setSize({
      width: styles.width,
      height: styles.height,
    });
  }, []);

  return (
    <div
      style={{
        width: size.width,
        height: size.height,
        opacity: 0,
        pointerEvents: 'none', // чтобы не перехватывал клики
      }}
    />
  );
};

export default NavigationSkeleton;
