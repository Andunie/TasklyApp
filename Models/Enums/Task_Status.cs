namespace TasklyApp.Models.Enums;

public enum Task_Status
{
    ToDo,        // 0 - Yapılacak
    InProgress,  // 1 - Devam Ediyor
    InReview,    // 2 - İnceleniyor (YENİ)
    Done,        // 3 - Tamamlandı
    Cancelled    // 4 - İptal
}
