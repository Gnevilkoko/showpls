import { useEffect, useState } from 'react';

const NavigationSkeleton = () => {
  const [size, setSize] = useState<{ height: string }>({
    height: '0px',
  });

  useEffect(() => {
    const el = document.querySelector('.navigation') as HTMLElement | null;
    if (!el) return; // если элемент ещё не смонтирован, просто выходим

    const styles = getComputedStyle(el);
    setSize({
      height: styles.height,
    });
  }, []);

  return (
    <div
      style={{
        height: size.height,
        opacity: 0,
        pointerEvents: 'none', // чтобы не перехватывал клики
      }}
    />
  );
};

export default NavigationSkeleton;
