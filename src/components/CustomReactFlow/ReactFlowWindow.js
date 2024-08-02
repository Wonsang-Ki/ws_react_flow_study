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
import { useCallback, useState, useRef, useEffect, useMemo } from "react";
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
  const [jsonData, setJsonData] = useState("");

  const onConnect = useCallback(
    (params) =>
      setEdges((eds) =>
        addEdge({ ...params, markerEnd: { type: MarkerType.Arrow } }, eds)
      ),
    [setEdges]
  );

  const addNode = useCallback(() => {
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
  }, [setNodes]);

  const getChildrenNodes = useCallback(
    (nodeId) => {
      const node = getNode(nodeId);
      return nodes.filter(
        (n) => n.position.y > node.position.y && n.id !== nodeId
      );
    },
    [nodes, getNode]
  );

  const moveNode = useCallback(
    (nodeId, x, y) => {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === nodeId) {
            return {
              ...node,
              position: {
                x: node.position.x + x,
                y: node.position.y + y,
              },
            };
          }
          return node;
        })
      );
    },
    [setNodes]
  );

  const onAddEdgeClick = useCallback(
    (edgeId) => {
      setMaxNodeId((prevMaxNodeId) => {
        const newMaxNodeId = prevMaxNodeId + 1;

        const oldSourceNode = getNode(getEdge(edgeId).source);
        const oldTargetNode = getNode(getEdge(edgeId).target);

        const newTargetNode = {
          id: newMaxNodeId.toString(),
          type: "mid-node",
          data: { label: `Node ${newMaxNodeId}` },
          style: { width: "200px", height: "50px" },
          draggable: false,
          position: {
            x: oldSourceNode.position.x,
            y: oldSourceNode.position.y + 100,
          },
        };

        setNodes((nds) => nds.concat(newTargetNode));

        setEdges((eds) => [
          ...eds,
          {
            source: oldSourceNode.id,
            target: newTargetNode.id,
            type: "add-edge",
            id: `xy-edge__${oldSourceNode.id}-${newTargetNode.id}`,
            deletable: false,
            data: { onAddEdgeClick },
          },
        ]);

        setEdges((eds) =>
          eds.map((edge) => {
            if (edge.id === edgeId) {
              return {
                ...edge,
                source: newTargetNode.id,
                target: oldTargetNode.id,
                id: `xy-edge__${newTargetNode.id}-${oldTargetNode.id}`,
                deletable: false,
                data: { onAddEdgeClick },
              };
            }
            return edge;
          })
        );

        setNodes((nds) =>
          nds.map((node) => {
            if (
              node.position.y > oldSourceNode.position.y &&
              node.id !== newTargetNode.id
            ) {
              return {
                ...node,
                position: {
                  x: node.type === "mid-node" ? newTargetNode.position.x : node.position.x,
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

  const onNodesDelete = useCallback(
    (deletedNodes) => {
      setEdges((eds) =>
        eds.reduce((acc, edge) => {
          const deletedIds = new Set(deletedNodes.map((n) => n.id));
          if (!deletedIds.has(edge.source) && !deletedIds.has(edge.target)) {
            return [...acc, edge];
          }
          return acc;
        }, [])
      );

      deletedNodes.forEach((node) => {
        const incomers = getIncomers(node, nodes, edges);
        const outgoers = getOutgoers(node, nodes, edges);

        incomers.forEach((inNode) => {
          getChildrenNodes(inNode.id).forEach((childNode) => {
            moveNode(childNode.id, 0, -100);
          });
        });

        setEdges((eds) =>
          eds.concat(
            incomers.flatMap(({ id: source }) =>
              outgoers.map(({ id: target }) => ({
                source,
                target,
                type: "add-edge",
                id: `xy-edge__${source}-${target}`,
                deletable: false,
                data: { onAddEdgeClick },
              }))
            )
          )
        );
      });
    },
    [nodes, edges, onAddEdgeClick, getChildrenNodes, moveNode]
  );

  const exportToJson = useCallback(() => {
    if (rfInstance) {
      const flow = rfInstance.toObject();
      setJsonData(JSON.stringify(flow));
    }
  }, [rfInstance]);

  const showNodeInfo = (node) => {
    ref.current.resize([100, 100]);
  };

  const initialEdges = useMemo(
    () => [
      {
        source: "1",
        target: "2",
        type: "add-edge",
        id: "xy-edge__1-2",
        deletable: false,
        data: { onAddEdgeClick },
      },
    ],
    [onAddEdgeClick]
  );

  useEffect(() => {
    setEdges(initialEdges);
  }, [initialEdges, setEdges]);

  return (
    <div style={{ height: "100%", width: "100%" }}>
      <Allotment ref={ref} defaultSizes={[100, 0]}>
        <Allotment.Pane className="split-left-view" minSize={50} style={{ height: "50px" }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodeClick={(event, node) => showNodeInfo(node)}
            onPaneClick={() => ref.current.resize([100, 0])}
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
                position: "absolute",
                right: 10,
                top: 10,
                zIndex: 1000,
              }}
            >
              Add Node
            </Button>
            <Button
              intent="primary"
              onClick={exportToJson}
              style={{
                position: "absolute",
                right: 10,
                top: 50,
                zIndex: 1000,
              }}
            >
              Export to JSON
            </Button>
          </ReactFlow>
        </Allotment.Pane>
        <Allotment.Pane className="split-right-view" minSize={0} maxSize={500} style={{ overflow: "auto" }}>
          <div className="menu-bar" style={{ overflow: "auto", height: "auto" }}>
            <JSONPretty id="json-pretty" data={jsonData} style={{ overflow: "auto", height: "auto" }}></JSONPretty>
          </div>
        </Allotment.Pane>
      </Allotment>
    </div>
  );
}

export default FlowProvider;
