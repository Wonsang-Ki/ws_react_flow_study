import React from 'react';
import CircularIcon from '../../CircularIcon';
import {
  Handle,
  Position
} from "@xyflow/react";
import goalFlag from "../../../statics/goal_flag.svg"
const DummyEndNode = ({data}) => {
  // Handle the logic for the end node here

  return (
    <div className='dummyEndNode'>
      <img src= {goalFlag} alt="Goal Flag" style = {{ "width" : "15px"}}/>
      <Handle type="target" position={Position.Top} />
    </div>

  );
};

export default DummyEndNode;