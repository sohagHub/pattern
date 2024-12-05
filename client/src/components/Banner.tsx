import { Link } from 'react-router-dom';

interface Props {
  doNotShowNav?: boolean;
}

const Banner = (props: Props) => {
  return (
    <div id="banner" className="bottom-border-content">
      <div className="banner-header" style={{ width: '100%' }}>
        <h2 className="everpresent-content__heading">ST Finance</h2>
        {!props.doNotShowNav && (
          <nav>
            <ul>
              <li className="nav-item">
                <Link to="/home">Home</Link>
              </li>
              <li className="nav-item">
                <Link to="/transactions">Transactions</Link>
              </li>
              <li className="nav-item">
                <Link to="/trends">Trends</Link>
              </li>
              <li className="nav-item">
                <Link to="/settings">Settings</Link>
              </li>
            </ul>
          </nav>
        )}
      </div>
    </div>
  );
};

export default Banner;
