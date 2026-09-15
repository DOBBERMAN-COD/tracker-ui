import React from 'react';
import {
  NavItem, Modal, Button, NavDropdown, MenuItem,
} from 'react-bootstrap';

import withToast from './withToast.jsx';

class SigninNavItem extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      showing: false,
      gisReady: false,
    };
    this.googleButton = React.createRef();
    this.showModal = this.showModal.bind(this);
    this.hideModal = this.hideModal.bind(this);
    this.signOut = this.signOut.bind(this);
    this.initializeGoogleSignIn = this.initializeGoogleSignIn.bind(this);
    this.handleCredentialResponse = this.handleCredentialResponse.bind(this);
  }

  componentDidMount() {
    if (window.google && window.google.accounts) {
      this.initializeGoogleSignIn();
    } else {
      window.addEventListener(
        'google-identity-services-loaded',
        this.initializeGoogleSignIn,
      );
    }
  }

  async loadData() {
    const { showError } = this.props;
    try {
      const apiEndpoint = window.ENV.UI_AUTH_ENDPOINT;
      const response = await fetch(`${apiEndpoint}/user`, { method: 'POST' });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Could not load the signed-in user.');

      const { signedIn, givenName } = result;
      this.setState({ user: { signedIn, givenName } });
    } catch (error) {
      showError(`Error loading signed-in user: ${error.message}`);
    }
  }

  componentDidUpdate(prevProps, prevState) {
    const { showing, gisReady } = this.state;
    if (showing && gisReady && (!prevState.showing || !prevState.gisReady)) {
      window.google.accounts.id.renderButton(this.googleButton.current, {
        theme: 'outline',
        size: 'large',
        text: 'signin_with',
        width: 250,
      });
    }
  }

  componentWillUnmount() {
    window.removeEventListener(
      'google-identity-services-loaded',
      this.initializeGoogleSignIn,
    );
  }

  initializeGoogleSignIn() {
    const clientId = window.ENV && window.ENV.GOOGLE_CLIENT_ID;
    const { showError } = this.props;
    if (!clientId || !window.google || !window.google.accounts) return;
    try {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: this.handleCredentialResponse,
        auto_select: false,
      });
      this.setState({ gisReady: true });
    } catch (error) {
      showError(`Error initializing Google Sign-In: ${error.message}`);
    }
  }

  async handleCredentialResponse(response) {
    const { showError } = this.props;
    try {
      const apiEndpoint = window.ENV.UI_AUTH_ENDPOINT;
      const apiResponse = await fetch(`${apiEndpoint}/signin`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ google_token: response.credential }),
      });
      const result = await apiResponse.json();
      if (!apiResponse.ok) {
        throw new Error(
          result.message || 'Server rejected the Google credential.',
        );
      }

      const { signedIn, givenName } = result;
      const { onUserChange } = this.props;
      onUserChange({ signedIn, givenName });

      this.hideModal();
      this.setState({ user: { signedIn, givenName } });
    } catch (error) {
      showError(`Error signing into the app: ${error.message}`);
    }
  }

  async signOut() {
    const apiEndpoint = window.ENV.UI_AUTH_ENDPOINT;
    const { showError } = this.props;

    try {
      const response = await fetch(`${apiEndpoint}/signout`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(
          `Sign-out request failed with status ${response.status}`,
        );
      }

      const auth2 = window.gapi.auth2.getAuthInstance();

      if (auth2) {
        await auth2.signOut();
      }

      const { onUserChange } = this.props;
      onUserChange({ signedIn: false, givenName: '' });
    } catch (error) {
      showError(`Error signing out: ${error}`);
    }
  }

  showModal() {
    const clientId = window.ENV && window.ENV.GOOGLE_CLIENT_ID;
    const { showError } = this.props;
    if (!clientId) {
      showError('Missing environment variable GOOGLE_CLIENT_ID');
      return;
    }
    this.setState({ showing: true });
  }

  hideModal() {
    this.setState({ showing: false });
  }

  render() {
    const { user } = this.props;
    if (user.signedIn) {
      return (
        <NavDropdown title={user.givenName} id="user">
          <MenuItem onClick={this.signOut}>Sign out</MenuItem>
        </NavDropdown>
      );
    }

    const { showing, gisReady } = this.state;
    return (
      <>
        <NavItem onClick={this.showModal}>Sign in</NavItem>
        <Modal keyboard show={showing} onHide={this.hideModal} bsSize="sm">
          <Modal.Header closeButton>
            <Modal.Title>Sign in</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {gisReady ? (
              <div ref={this.googleButton} />
            ) : (
              <Button block disabled bsStyle="primary">
                Loading Google Sign-In...
              </Button>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button bsStyle="link" onClick={this.hideModal}>
              Cancel
            </Button>
          </Modal.Footer>
        </Modal>
      </>
    );
  }
}

export default withToast(SigninNavItem);
