import { TestBed } from '@angular/core/testing';

import { Salidas } from './salidas';

describe('Salidas', () => {
  let service: Salidas;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Salidas);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
