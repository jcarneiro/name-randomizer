// @flow
import React, { Component } from 'react';
// import { Link } from 'react-router-dom';
// import routes from '../../constants/routes';
// import styles from './index.css';

import TeamGenerator from '../TeamGenerator';

type Props = {};

export default class Home extends Component<Props> {
  props: Props;

  render() {
    return (
      <div data-tid="container">
        {/* <Link to={routes.COUNTER}>to Counter</Link> */}
        <TeamGenerator />
      </div>
    );
  }
}
