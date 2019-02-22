describe('Hello Angular', () => {
  beforeEach(() => {
    cy.visit('http://localhost:4200');
  });

  it('should display welcome message', () => {
    cy.get('app-root h1').should('contain', 'Welcome');
  });

  it('has 3 links', () => {
    cy.get('app-root li a').should('have.length', 3);
  });
});