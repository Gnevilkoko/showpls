import { useTranslation } from 'react-i18next';

interface ToggleProfileModeProps {
  activeMode: 'customer' | 'performer';
  callback: (val: 'customer' | 'performer') => void;
  isProfile?: boolean;
}

const ToggleProfileMode = ({
  activeMode,
  callback,
  isProfile = false,
}: ToggleProfileModeProps) => {
  const { t } = useTranslation();

  return (
    <div className={`toggle-profile-mode ${isProfile ? 'gray' : ''}`}>
      <button
        className={`prof-mode__toggle ${
          activeMode === 'customer' ? 'active green' : ''
        }`}
        onClick={() => callback('customer')}
      >
        {/* {isProfile === true ? "I'm customer" : 'Customer'} */}
        {t('customerBtn')}
      </button>

      <button
        className={`prof-mode__toggle ${
          activeMode === 'performer' ? 'active blue' : ''
        }`}
        onClick={() => callback('performer')}
      >
        {/* {isProfile === true ? "I'm performer" : 'Performer'} */}
        {t('performerBtn')}
      </button>
    </div>
  );
};

export default ToggleProfileMode;
