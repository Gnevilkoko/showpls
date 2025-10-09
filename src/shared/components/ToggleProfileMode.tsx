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
  return (
    <div className={`toggle-profile-mode ${isProfile ? 'gray' : ''}`}>
      <button
        className={`prof-mode__toggle ${
          activeMode === 'customer' ? 'active green' : ''
        }`}
        onClick={() => callback('customer')}
      >
        {/* {isProfile === true ? "I'm customer" : 'Customer'} */}
        Customer
      </button>

      <button
        className={`prof-mode__toggle ${
          activeMode === 'performer' ? 'active blue' : ''
        }`}
        onClick={() => callback('performer')}
      >
        {/* {isProfile === true ? "I'm performer" : 'Performer'} */}
        Performer
      </button>
    </div>
  );
};

export default ToggleProfileMode;
