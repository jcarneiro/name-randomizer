import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
  Container,
  Row,
  Col,
  Button,
  Form,
  FormGroup,
  Label,
  Modal,
  ModalBody,
  ModalFooter
} from 'reactstrap';
import { shuffle } from 'lodash';
import mouseTrap from 'react-mousetrap';
import randomColor from 'randomcolor';
import ReactFitText from 'react-fittext';
import { SketchPicker } from 'react-color';
import fs from 'fs';
import uuidv4 from 'uuid/v4';

import { alterColor, rgbToHex } from '../../actions/color';

const PREFIX_ACTIVE = 'active';
const PREFIX_EDIT = 'edit';
const PREFIX_DELETE = 'delete';

function createGradient(color) {
  return `linear-gradient(${color} 40%, ${alterColor(color, 80)})`;
}

function shuffleNames(names) {
  return shuffle(names.filter(item => item.active)).concat(
    names.filter(item => !item.active)
  );
}

function saveState(names) {
  const data = JSON.stringify({ names });

  fs.writeFile('names.json', data, err => {
    if (err) throw err;
  });
}

class Player {
  constructor(id, name, color, active) {
    this.id = id;
    this.name = name;
    this.color = color;
    this.active = active;
  }
}

const NameTag = props => {
  const { item, onClick, onEdit, onDelete } = props;

  return (
    <div
      className="nameTag subtitle text-center m-2"
      role="button"
      tabIndex="0"
      style={{
        position: 'relative',
        backgroundImage: createGradient(item.color)
      }}
      onClick={onClick}
      onKeyPress={() => {}}
    >
      <ReactFitText compressor={0.5} maxFontSize={30}>
        <div id={PREFIX_ACTIVE + item.id}>{item.name}</div>
      </ReactFitText>
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          paddingTop: '0.1rem',
          paddingRight: '0.2rem'
        }}
      >
        <i
          id={PREFIX_EDIT + item.id}
          role="button"
          tabIndex="0"
          style={{ paddingRight: '0.2rem' }}
          className="fa fa-edit"
          onClick={onEdit}
          onKeyPress={() => {}}
        />
        <i
          id={PREFIX_DELETE + item.id}
          role="button"
          tabIndex="0"
          className="fa fa-times"
          onClick={onDelete}
          onKeyPress={() => {}}
        />
      </div>
    </div>
  );
};

NameTag.propTypes = {
  item: PropTypes.instanceOf(Player).isRequired,
  onClick: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired
};

class TeamGenerator extends Component {
  constructor(props, context) {
    super(props, context);

    this.onNameTagClick = this.onNameTagClick.bind(this);
    this.onNameTagEdit = this.onNameTagEdit.bind(this);
    this.onNameTagDelete = this.onNameTagDelete.bind(this);
    this.allActive = this.allActive.bind(this);
    this.allInactive = this.allInactive.bind(this);
    this.addOrEditPlayer = this.addOrEditPlayer.bind(this);
    this.toggleModal = this.toggleModal.bind(this);

    this.playerNameRef = React.createRef();
    this.playerBgRef = React.createRef();
    this.playerColorSwatchRef = React.createRef();
    this.benchedRef = React.createRef();

    let rawNames = JSON.parse(fs.readFileSync('names.json', 'utf8')).names;

    rawNames = shuffleNames(rawNames);

    this.state = {
      teamSize: 2,
      modal: false,
      history: [],
      editIndex: -1,
      displayColorPicker: false,
      names: rawNames.map(
        item => new Player(item.id, item.name, item.color, item.active)
      )
    };
  }

  componentWillMount() {
    /* this.props.bindShortcut('ctrl+z', () => {
      const state = this.state;
      if (state.history.length === 0) {
        return;
      }
      const move = state.history.pop();
      if (move.action === 0) {
        state.names = state.names.concat(move.player);
      } else {
        // state.names = state.names.
      }
      this.setState(state);
    }); */
  }

  pickTeams = size => {
    const { names } = this.state;
    this.setState({
      teamSize: size,
      names: shuffleNames(names)
    });
  };

  sortNameTags = state =>
    state.names.filter(item => item.active).concat(
      state.names.filter(item => !item.active).sort((a, b) => {
        const x = a.name.toLowerCase();
        const y = b.name.toLowerCase();
        if (x < y) {
          return -1;
        }
        if (x > y) {
          return 1;
        }
        return 0;
      })
    );

  onNameTagClick = e => {
    const { state } = this;
    const id = e.target.id.substring(PREFIX_ACTIVE.length);
    const idx = state.names.findIndex(item => item.id === id);

    if (e.ctrlKey) {
      const removed = state.names.splice(idx, 1)[0];
      state.history = state.history.concat({ action: 0, player: removed });
    } else {
      state.names[idx].active = !state.names[idx].active;
      state.names = this.sortNameTags(state);
    }
    this.setState(state);
  };

  onNameTagEdit = e => {
    const { state } = this;
    e.stopPropagation();
    const id = e.target.id.substring(PREFIX_EDIT.length);
    const idx = state.names.findIndex(item => item.id === id);
    this.setState({ editIndex: idx }, this.toggleModal);
  };

  onNameTagDelete = e => {
    const { state } = this;
    e.stopPropagation();
    const id = e.target.id.substring(PREFIX_DELETE.length);
    state.names = state.names.filter(item => item.id !== id);
    // const idx = state.names.findIndex(item => item.id === id);
    // state.names.splice(idx, 1)[0];
    saveState(state.names);
    this.setState(state);
  };

  allActive = () => {
    const { state } = this;
    state.names = state.names.map(item => {
      const mod = item;
      mod.active = true;
      return mod;
    });
    state.names = shuffle(state.names);
    this.setState(state);
  };

  allInactive = () => {
    const { state } = this;
    state.names = state.names.map(item => {
      const mod = item;
      mod.active = false;
      return mod;
    });
    state.names = this.sortNameTags(state);
    this.setState(state);
  };

  addOrEditPlayer = () => {
    const { state } = this;
    const newName = this.playerNameRef.current.value;

    if (!newName || newName.length === 0) {
      return;
    }

    const newColor = rgbToHex(
      this.playerColorSwatchRef.current.style.backgroundColor
    );

    if (state.editIndex >= 0) {
      state.names[state.editIndex].name = newName;
      state.names[state.editIndex].color = newColor;
    } else {
      state.names = state.names.concat(
        new Player(uuidv4(), newName, newColor, true)
      );
    }

    state.history = state.history.concat({
      action: 1,
      player: state.names[state.names.length - 1]
    });

    saveState(state.names);
    this.setState(state);
    this.toggleModal();
  };

  toggleModal() {
    const { modal } = this.state;
    this.setState({
      modal: !modal
    });
  }

  handleClick = () => {
    const { displayColorPicker } = this.state;
    this.setState({ displayColorPicker: !displayColorPicker });
  };

  handleClose = () => {
    this.setState({ displayColorPicker: false });
  };

  render() {
    const {
      teamSize,
      names,
      modal,
      displayColorPicker,
      editIndex
    } = this.state;
    const popover = {
      position: 'absolute',
      zIndex: '2'
    };
    const cover = {
      position: 'fixed',
      top: '0px',
      right: '0px',
      bottom: '0px',
      left: '0px'
    };
    return (
      <React.Fragment>
        <nav
          className="navbar navbar-expand navbar-dark d-none d-lg-flex"
          id="sideNav"
          ref={this.benchedRef}
        >
          <h1 className="title">Benched</h1>
          {names.filter(item => !item.active).map(item => (
            <NameTag
              key={item.id}
              item={item}
              onClick={this.onNameTagClick}
              onEdit={this.onNameTagEdit}
              onDelete={this.onNameTagDelete}
            />
          ))}
        </nav>

        <Container fluid id="activePlayers">
          <Row className="justify-content-center align-items-center text-center">
            <Col>
              <h1 className="title">Active Players</h1>
            </Col>
          </Row>
          <Row
            className="justify-content-center align-items-center"
            style={{ maxHeight: '70vh', overflow: 'auto' }}
          >
            {names.filter(item => item.active).map(item => (
              <Col key={item.id} sm={{ size: 12 / teamSize }}>
                <NameTag
                  item={item}
                  onClick={this.onNameTagClick}
                  onEdit={this.onNameTagEdit}
                  onDelete={this.onNameTagDelete}
                />
              </Col>
            ))}
          </Row>
          <div id="footer" className="row">
            <div style={{ flexGrow: 1 }} />
            <div className="justify-content-center align-items-center text-center">
              <Col>
                <Button
                  color="primary"
                  onClick={() => this.pickTeams(2)}
                  className="mx-2"
                >
                  Teams of 2
                </Button>
                <Button
                  color="primary"
                  onClick={() => this.pickTeams(3)}
                  className="mx-2"
                >
                  Teams of 3
                </Button>
                <Button
                  color="primary"
                  onClick={() => this.pickTeams(4)}
                  className="mx-2"
                >
                  Teams of 4
                </Button>
              </Col>
            </div>
            <div className="text-center pt-3">
              <Col>
                <Button
                  color="primary"
                  onClick={this.allActive}
                  className="mx-2"
                >
                  Clear the Bench!!
                </Button>
                <Button
                  color="primary"
                  onClick={this.toggleModal}
                  className="mx-2"
                >
                  Add Player
                </Button>
                <Button
                  color="primary"
                  onClick={this.allInactive}
                  className="mx-2"
                >
                  You&#39;re All Benched!!
                </Button>
              </Col>
            </div>
          </div>
        </Container>
        <Modal
          backdrop="static"
          centered
          isOpen={modal}
          toggle={this.toggleModal}
          onOpened={() => {
            if (editIndex >= 0) {
              const player = names[editIndex];
              this.playerNameRef.current.value = player.name;
              this.playerBgRef.current.style.backgroundImage = createGradient(
                player.color
              );
              this.playerColorSwatchRef.current.style.backgroundColor =
                player.color;
            } else {
              const newColor = randomColor({ luminosity: 'dark' });
              this.playerBgRef.current.style.backgroundImage = createGradient(
                newColor
              );
              this.playerColorSwatchRef.current.style.backgroundColor = newColor;
            }
            this.playerNameRef.current.focus();
          }}
          onClosed={() => {
            this.setState({ editIndex: -1 });
          }}
        >
          <div
            id="playerModalHeader"
            className="modal-header subtitle"
            ref={this.playerBgRef}
          >
            {editIndex >= 0 ? 'Edit Player' : 'Add Player'}
          </div>
          <ModalBody>
            <Form>
              <FormGroup row>
                <Label for="playerName" sm={2}>
                  Name
                </Label>
                <Col sm={10}>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Enter name"
                    ref={this.playerNameRef}
                    onKeyUp={e => {
                      if (e.key === 'Enter') {
                        this.addOrEditPlayer();
                      } else if (e.key === 'Esc') {
                        this.toggleModal();
                      }
                    }}
                  />
                </Col>
              </FormGroup>
              <FormGroup row>
                <Label for="playerName" sm={2}>
                  Color
                </Label>
                <Col sm={10}>
                  <div
                    role="button"
                    tabIndex="0"
                    className="align-middle"
                    style={{
                      display: 'inline-block',
                      width: '20px',
                      height: '20px',
                      margin: '0px 10px 10px 0px'
                    }}
                    onClick={this.handleClick}
                    onKeyPress={() => {
                      console.log('TODO');
                    }}
                  >
                    <div
                      ref={this.playerColorSwatchRef}
                      style={{
                        background: 'rgb(208, 2, 27)',
                        height: '100%',
                        width: '100%',
                        cursor: 'pointer',
                        position: 'relative',
                        top: '25%',
                        outline: 'none',
                        borderRadius: '3px',
                        boxShadow: 'rgba(0, 0, 0, 0.15) 0px 0px 0px 1px inset'
                      }}
                    />
                  </div>
                  {displayColorPicker ? (
                    <div style={popover}>
                      <div
                        role="button"
                        tabIndex="0"
                        style={cover}
                        onClick={this.handleClose}
                        onKeyPress={() => {
                          console.log('TODO');
                        }}
                      />
                      <SketchPicker
                        // TODO: Add color attribute
                        onChangeComplete={color => {
                          this.playerBgRef.current.style.backgroundImage = createGradient(
                            color.hex
                          );
                          this.playerColorSwatchRef.current.style.backgroundColor =
                            color.hex;
                        }}
                      />
                    </div>
                  ) : null}
                  <Button
                    color="secondary"
                    size="sm"
                    onClick={() => {
                      const newColor = randomColor({ luminosity: 'dark' });
                      this.playerBgRef.current.style.backgroundImage = createGradient(
                        newColor
                      );
                      this.playerColorSwatchRef.current.style.backgroundColor = newColor;
                    }}
                  >
                    Random
                  </Button>
                </Col>
              </FormGroup>
            </Form>
          </ModalBody>
          <ModalFooter>
            <Button color="primary" onClick={this.addOrEditPlayer}>
              Submit
            </Button>
            <Button color="primary" onClick={this.toggleModal}>
              Cancel
            </Button>
          </ModalFooter>
        </Modal>
      </React.Fragment>
    );
  }
}

export default mouseTrap(TeamGenerator);
