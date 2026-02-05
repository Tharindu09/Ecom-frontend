import React from "react";

const QuantityPicker = ({ value, onChange, min = 1, max = 99 }) => {
  const handleChange = (nextValue) => {
    if (Number.isNaN(nextValue)) return;
    if (nextValue < min || nextValue > max) return;
    onChange(nextValue);
  };

  return (
    <div className="qty">
      <button
        type="button"
        className="qty__btn"
        onClick={() => handleChange(value - 1)}
        disabled={value <= min}
      >
        -
      </button>
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(event) => handleChange(Number(event.target.value))}
      />
      <button
        type="button"
        className="qty__btn"
        onClick={() => handleChange(value + 1)}
        disabled={value >= max}
      >
        +
      </button>
    </div>
  );
};

export default QuantityPicker;
