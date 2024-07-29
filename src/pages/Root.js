import ReactFlowWindow from "../components/ReactFlowWindow";
import { Allotment } from 'allotment';
import '../styles/Root.css';
import "allotment/dist/style.css";

function Root() {
  return (
    <>
      <Allotment defaultSizes={[100, 500]}>
        <Allotment.Pane minSize={200}>
          <div className="menu-bar">
            <ul>
              <li>abc</li>
            </ul>
          </div>
        </Allotment.Pane>
        <Allotment.Pane minSize={50} style = {{height:"50px"}}>
          <ReactFlowWindow/>
        </Allotment.Pane>
      </Allotment>
    </>
  );
}

export default Root;
