import {
  ReactFlow,
  addEdge,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  useEdgesState,
  useNodesState,
  ReactFlowProvider,
  MarkerType,
  getIncomers,
  getOutgoers,
  Handle,
  Position,
  useReactFlow,
  getConnectedEdges,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useCallback, useState, useRef, useEffect } from "react";
import { Button } from "@blueprintjs/core";
import "../../styles/ReactFlowWindow.css";
import { Allotment } from "allotment";
import "allotment/dist/style.css";
import StartNode from "./nodes/StartNode";
import MidNode from "./nodes/MidNode";
import DummyEndNode from "./nodes/DummyEndNode";
import AddEdge from "./edges/AddEdge";
import AddWithBranchEdge from "./edges/AddWithBranchEdge";
import JSONPretty from "react-json-pretty";

const initialNodes = [
  {
    id: "1",
    type: "start-node",
    data: { label: "Start Node" },
    draggable: false,
    deletable: false,
    style: { width: "200px", height: "40px" },
    position: { x: 0, y: 0 },
  },
  {
    id: "2",
    type: "dummy-end-node",
    data: { label: "End Node" },
    draggable: false,
    deletable: false,
    style: { borderRadius: "50%", width: "35px", height: "35px" },
    position: { x: 82.5, y: 100 },
  },
];

const nodeTypes = {
  "start-node": StartNode,
  "mid-node": MidNode,
  "dummy-end-node": DummyEndNode,
};

const edgeTypes = {
  "add-edge": AddEdge,
  "add-with-branch-edge": AddWithBranchEdge,
};

function FlowProvider() {
  return (
    <ReactFlowProvider>
      <ReactFlowWindow />
    </ReactFlowProvider>
  );
}

function ReactFlowWindow() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [maxNodeId, setMaxNodeId] = useState(initialNodes.length);

  const ref = useRef();
  const [rfInstance, setRfInstance] = useState(null);

  const { getEdge, getNode } = useReactFlow();

  let [jsonData, setJsonData] = useState("");

  const onConnect = useCallback(
    (params) =>
      setEdges((eds) =>
        addEdge({ ...params, markerEnd: { type: MarkerType.Arrow } }, eds)
      ),
    [setEdges]
  );

  const onAddEdgeClick = useCallback(
    (edgeId) => {
      setMaxNodeId((prevMaxNodeId) => {
        const newMaxNodeId = prevMaxNodeId + 1;
        console.log("Updating maxNodeId to:", newMaxNodeId);

        const oldSourceNode = getNode(getEdge(edgeId).source);
        const oldTargetNode = getNode(getEdge(edgeId).target);

        const newTargetNode = {
          id: newMaxNodeId.toString(),
          type: "mid-node",
          data: { label: `Node ${newMaxNodeId.toString()}` },
          style: { width: "200px", height: "50px" },
          draggable: false,
          position: {
            x: oldSourceNode.position.x,
            y: oldSourceNode.position.y + 100,
          },
        };

        setNodes((nds) => nds.concat(newTargetNode));

        setEdges((eds) =>
          eds.concat({
            source: oldSourceNode.id,
            target: newTargetNode.id,
            type: "add-edge",
            id: `xy-edge__${oldSourceNode.id}-${newTargetNode.id}`,
            deletable: false,
            data: {
              onAddEdgeClick: onAddEdgeClick,
            },
          })
        );

        setEdges((eds) =>
          eds.map((edge) => {
            if (edge.id === edgeId) {
              return {
                ...edge,
                source: newTargetNode.id,
                target: oldTargetNode.id,
                id: `xy-edge__${newTargetNode.id}-${oldTargetNode.id}`,
                deletable: false,
                data: {
                  onAddEdgeClick: onAddEdgeClick,
                },
              };
            }
            return edge;
          })
        );

        setNodes((nds) => // useState 로 아직 반영되기 전이라 getChildrenNodes 에서 사용하는 nodes에선 아직 새로운 노드 정보를 가져올 수 없는 거 같음.
          nds.map((node) => {
            if (
              node.position.y > oldSourceNode.position.y &&
              node.id !== newTargetNode.id
            ) {
              return {
                ...node,
                position: {
                  x:
                    node.type === "mid-node"
                      ? newTargetNode.position.x
                      : node.position.x,
                  y: node.position.y + 100,
                },
              };
            }
            return node;
          })
        );
        return newMaxNodeId;

      });
    },
    [getEdge, getNode, setEdges, setNodes]
  );

  const initialEdges = [
    {
      source: "1",
      target: "2",
      type: "add-edge",
      id: "xy-edge__1-2",
      deletable: false,
      data: {
        onAddEdgeClick: onAddEdgeClick,
      },
    },
  ];

  useState(() => {
    setEdges(initialEdges);
  }, [setEdges, onAddEdgeClick]);

  const addNode = () => {
    setMaxNodeId((prevMaxNodeId) => {
      const newMaxNodeId = prevMaxNodeId + 1;
      const newNode = {
        id: newMaxNodeId.toString(),
        data: { label: `Node ${newMaxNodeId}` },
        type: "mid-node",
        position: { x: Math.random() * 400, y: Math.random() * 400 },
      };
      setNodes((nds) => nds.concat(newNode));
      return newMaxNodeId;
    });
  };

  const getChildrenNodes = (nodeId) => {
    return nodes.filter((node) => node.position.y > getNodeById(nodeId).position.y && node.id !== nodeId);
  };

  const onNodesDelete = useCallback(
    (deletedNode) => {
      setEdges(
        deletedNode.reduce((acc, node) => {
          const incomers = getIncomers(node, nodes, edges);
          const outgoers = getOutgoers(node, nodes, edges);
          const connectedEdges = getConnectedEdges([node], edges);

          const remainingEdges = acc.filter(
            (edge) => !connectedEdges.includes(edge)
          );

          const createdEdges = incomers.flatMap(({ id: source }) =>
            outgoers.map(({ id: target }) => {
            
            getChildrenNodes(source).forEach((childNode) => {
              console.log(childNode.id);
              moveNode(childNode.id, 0, -100);
            })

            return{
              source,
              target,
              type: "add-edge",
              id: `xy-edge__${source}-${target}`,
              deletable: false,
              data: {
                onAddEdgeClick: onAddEdgeClick,
              },
            }
          })
          );

          return [...remainingEdges, ...createdEdges];
        }, edges)
      );


    },
    [nodes, edges]
  );
  
  const getNodeById = (nodeId) => {
    return nodes.find((node) => node.id === nodeId);
  }

  const moveNode = (nodeId, x, y) => {
    const selectedNode = getNodeById(nodeId);

    if (!selectedNode) {
      console.error(`Node with id ${nodeId} not found`);
      return;
    }
  
    setNodes((nodes) =>
      nodes.map((node) => {
        if(node.id === selectedNode.id) {
          
          return {
            ...node,
            position: {
              x: selectedNode.position.x + x,
              y: selectedNode.position.y + y,
            },
          };
        }
        return node;
      })
    );
  }

  const exportToJson = useCallback(() => {
    console.log(rfInstance);
    if (rfInstance) {
      const flow = rfInstance.toObject();
      console.log(JSON.stringify(flow));
      setJsonData(JSON.stringify(flow));
    }
  }, [rfInstance]);

  const showNodeInfo = (node) => {
    ref.current.resize([100, 100]);
  };

  return (
    <div style={{ height: "100%", width: "100%" }}>
      <Allotment ref={ref} defaultSizes={[100, 0]}>
        <Allotment.Pane
          className="split-left-view"
          minSize={50}
          style={{ height: "50px" }}
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodeClick={(event, node) => {
              showNodeInfo(node);
            }}
            onPaneClick={(event) => {
              ref.current.resize([100, 0]);
            }}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodesDelete={onNodesDelete}
            onConnect={onConnect}
            onInit={setRfInstance}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            defaultEdgeOptions={{ type: "add-edge" }}
            fitView
          >
            <MiniMap />
            <Controls />
            <Background variant={BackgroundVariant.Cross} />

            <Button
              icon="add"
              intent="primary"
              onClick={addNode}
              style={{
                position: "relative",
                float: "right",
                margin: "10px",
                zIndex: 1000,
              }}
            >
              Add Node
            </Button>
            <Button
              intent="primary"
              onClick={exportToJson}
              style={{
                position: "relative",
                float: "right",
                margin: "10px",
                zIndex: 1000,
              }}
            >
              export to json
            </Button>
          </ReactFlow>
        </Allotment.Pane>
        <Allotment.Pane
          className="split-right-view"
          minSize={0}
          maxSize={500}
          style={{ overflow: "auto" }}
        >
          <div>
            <div
              className="menu-bar"
              style={{ overflow: "auto", height: "auto" }}
            >
              <JSONPretty
                id="json-pretty"
                data={jsonData}
                style={{ overflow: "auto", height: "auto" }}
              ></JSONPretty>
            </div>
          </div>
        </Allotment.Pane>
      </Allotment>
    </div>
  );
}

export default FlowProvider;
