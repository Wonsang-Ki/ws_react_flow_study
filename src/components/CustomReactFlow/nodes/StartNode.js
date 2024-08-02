import React from 'react';
import {
  Handle,
  Position
} from "@xyflow/react";

const StartNode = ({data}) => {
  // Handle the logic for the end node here

  return (
    <>
      <div>start: {data?.label}</div>

      <Handle type="source" position={Position.Bottom} />
    </>

  );
};

export default StartNode;