using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Rms.Av.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddUniquePhoneIndexToCustomers : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_Customers_Phone",
                table: "Customers",
                column: "Phone",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Customers_Phone",
                table: "Customers");
        }
    }
}
