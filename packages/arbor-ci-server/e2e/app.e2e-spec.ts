import { ArborCiServerPage } from './app.po';

describe('arbor-ci-server App', () => {
  let page: ArborCiServerPage;

  beforeEach(() => {
    page = new ArborCiServerPage();
  });

  it('should display welcome message', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('Welcome to app!');
  });
});
