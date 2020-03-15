describe('Hello Angular', () => {
  beforeEach(() => {
    cy.visit('http://localhost:4200');
  });

  it('should display welcome header', () => {
    cy.get('.toolbar > span').should('contain', 'Welcome');
  });

  it('has 3 resources and 6 next steps', () => {
    cy.get('.content > .card-container > .card').should('have.length', 9);
  });
});
