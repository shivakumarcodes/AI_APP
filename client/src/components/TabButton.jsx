import React from 'react';

const TabButton = ({ id, icon: Icon, label, isActive, onClick }) => (
  <button
    onClick={() => onClick(id)}
    className={`tab-button ${isActive ? 'tab-button-active' : 'tab-button-inactive'}`}
  >
    <Icon size={20} />
    {label}
  </button>
);

export default TabButton;