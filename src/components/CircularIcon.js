// src/components/CircularIcon.js

import React from 'react';
import { Icon } from '@blueprintjs/core';
import PropTypes from 'prop-types';
import '../styles/Components.css';

const CircularIcon = ({ icon, size, color }) => {
  return (
    <div className="circular-icon" style={{ width: size, height: size, backgroundColor: color }}>
      <Icon icon={icon} size={size * 0.5} />
    </div>
  );
};

CircularIcon.propTypes = {
  icon: PropTypes.string.isRequired,
  size: PropTypes.number,
  color: PropTypes.string,
};

CircularIcon.defaultProps = {
  size: 40,
  color: '#fff',
};

export default CircularIcon;
