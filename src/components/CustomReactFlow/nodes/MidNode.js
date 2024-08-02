import React from 'react';
import {
  Handle,
  Position
} from "@xyflow/react";

const MidNode = ({data}) => {
  // Handle the logic for the end node here

  return (
    <>
      <div>mid: {data?.label}</div>

      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
    </>

  );
};

export default MidNode;