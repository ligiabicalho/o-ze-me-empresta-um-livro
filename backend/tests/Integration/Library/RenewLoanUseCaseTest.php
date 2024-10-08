<?php

namespace Tests\Integration\Library;

use App\Adapters\Presenters\Library\RenewLoanJsonPresenter;
use App\Core\Domain\Library\Exceptions\LoanAlreadyHaveFinished;
use App\Core\Domain\Library\Exceptions\LoanNotFound;
use App\Core\Domain\Library\Ports\UseCases\RenewLoan\RenewLoanRequestModel;
use App\Core\Domain\Library\Ports\UseCases\RenewLoan\RenewLoanUseCase;
use App\Core\Services\Library\RenewLoanService;
use App\Infra\Adapters\Persistence\Eloquent\Models\Book;
use App\Infra\Adapters\Persistence\Eloquent\Models\Loan;
use App\Infra\Adapters\Persistence\Eloquent\Repositories\LoanEloquentRepository;
use DateTime;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Log;
use Ramsey\Uuid\Uuid;
use Tests\TestCase;

class RenewLoanUseCaseTest extends TestCase
{
    use RefreshDatabase;

    private RenewLoanUseCase $useCase;

    private Loan $loan;

    protected function setUp(): void
    {
        parent::setUp();
        $this->useCase = new RenewLoanService(
            output: new RenewLoanJsonPresenter(),
            loanRepository: new LoanEloquentRepository()
        );
        $this->loan = Loan::where(['returned_at' => null])->first() ?? Loan::factory()->create(['returned_at' => null]);
    }

    public function testShouldRenewALoan()
    {
        $request = new RenewLoanRequestModel([
            "loanId" => $this->loan->id,
        ]);
        $loan = $this->useCase->execute($request)->resource->toArray(null);

        $today = new DateTime('now');
        $lastRenewedAt = new DateTime($loan['lastRenewedAt']);

        $lastReturnDate = new DateTime($this->loan->returnDate);
        $newReturnDate = $lastReturnDate->modify('+7 days')->format('Y-m-d');
        $returnDate = new DateTime($loan['returnDate']);


        $this->assertIsString($loan['id']);
        $this->assertEquals('active', $loan['status']);
        $this->assertEquals(false, $loan['book']['isAvailable']);

        $this->assertArrayHasKey('returnDate', $loan);
        $this->assertEquals($newReturnDate, $returnDate->format('Y-m-d'));

        $this->assertArrayHasKey('renewalCount', $loan);
        $this->assertEquals(1, $loan['renewalCount']);

        $this->assertArrayHasKey('lastRenewedAt', $loan);
        $this->assertEquals($today->format('Y-m-d'), $lastRenewedAt->format('Y-m-d'));
    }


    public function testShouldThrowLoanNotFound()
    {
        $invalidLoanId = Uuid::uuid4();
        $request = new RenewLoanRequestModel([
            "loanId" => $invalidLoanId
        ]);

        $this->expectException(LoanNotFound::class);
        $this->useCase->execute($request);
    }

    public function testShouldThrowLoanAlreadyHaveFinished()
    {
        $today = new DateTime('now');
        $returnedAt = $today->format(DateTime::ATOM);

        $loanEloquent = new LoanEloquentRepository();
        $loanEloquent->finalize($this->loan->id, $returnedAt);

        $request = new RenewLoanRequestModel([
            "loanId" => $this->loan->id,
        ]);

        $this->expectException(LoanAlreadyHaveFinished::class);
        $this->useCase->execute($request);
    }

}
