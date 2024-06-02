import { Link } from 'react-router-dom';

interface Props {
  initialSubheading?: boolean;
}

const Banner = (props: Props) => {
  return (
    <div id="banner" className="bottom-border-content">
      <div className="banner-header">
        <h2 className="everpresent-content__heading">ST Finance</h2>
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
      </div>
    </div>
  );
};

export default Banner;
