import { useEffect, useState } from 'react';

const NavigationSkeleton = () => {
  const [size, setSize] = useState<{ height: string }>({
    height: '0px',
  });

  useEffect(() => {
    const el = document.querySelector('.navigation') as HTMLElement | null;
    if (!el) return;

    const styles = getComputedStyle(el);
    const height = parseFloat(styles.height) + 14; // прибавляем нужное количество пикселей под макет

    setSize({
      height: `${height}px`,
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
