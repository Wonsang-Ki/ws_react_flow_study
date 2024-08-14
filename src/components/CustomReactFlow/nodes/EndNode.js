import React from 'react';
import {
  Handle,
  Position
} from "@xyflow/react";

const EndNode = ({data}) => {
  // Handle the logic for the end node here

  return (
    <>
      <div>{data?.label}</div>

      <Handle type="target" position={Position.Top} />
    </>

  );
};

export default EndNode;